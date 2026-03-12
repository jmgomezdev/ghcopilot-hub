import fs from "node:fs/promises";
import path from "node:path";

import { CliError } from "./errors.js";
import { MANAGED_ROOTS, getRequiredDirs } from "./constants.js";
import {
  ensureDir,
  fromRoot,
  pathExists,
  readTextIfExists,
  removeEmptyDirectories,
  walkFiles,
} from "./fs-utils.js";
import { hashContent, parseManagedFile, renderManagedFile } from "./managed-header.js";

export async function createDesiredFiles({ hubDir, resolvedState, revision }) {
  const desiredFiles = [];

  for (const baseFile of resolvedState.baseFiles) {
    desiredFiles.push(await materializeDesiredFile(baseFile, revision));
  }

  for (const agent of resolvedState.agents) {
    desiredFiles.push(await materializeDesiredFile(agent, revision));
  }

  for (const skill of resolvedState.skills) {
    for (const file of skill.files) {
      desiredFiles.push(await materializeDesiredFile(file, revision));
    }
  }

  return desiredFiles.sort((left, right) => left.targetRelativePath.localeCompare(right.targetRelativePath));
}

export async function planProjectSync({ projectDir, desiredFiles, onConflict }) {
  const desiredMap = new Map(desiredFiles.map((file) => [file.targetRelativePath, file]));
  const existingManagedEntries = await scanManagedEntries(projectDir);

  const create = [];
  const update = [];
  const remove = [];
  const conflicts = [];
  const unchanged = [];
  const missingManaged = [];
  const drifted = [];
  const unexpectedManaged = [];
  const unexpectedUnmanaged = [];

  for (const desiredFile of desiredFiles) {
    const absolutePath = fromRoot(projectDir, desiredFile.targetRelativePath);
    const currentContent = await readTextIfExists(absolutePath);

    if (currentContent === null) {
      create.push({ targetRelativePath: desiredFile.targetRelativePath, reason: "missing" });
      missingManaged.push(desiredFile.targetRelativePath);
      continue;
    }

    if (currentContent === desiredFile.renderedContent) {
      unchanged.push({ targetRelativePath: desiredFile.targetRelativePath });
      continue;
    }

    const parsedManaged = parseManagedFile({
      targetRelativePath: desiredFile.targetRelativePath,
      content: currentContent,
    });

    if (!parsedManaged) {
      conflicts.push({
        targetRelativePath: desiredFile.targetRelativePath,
        reason: "expected managed file but found unmanaged content",
      });
      unexpectedUnmanaged.push(desiredFile.targetRelativePath);
      continue;
    }

    if (parsedManaged.body === desiredFile.body) {
      update.push({ targetRelativePath: desiredFile.targetRelativePath, reason: "revision metadata changed" });
      continue;
    }

    const currentHash = hashContent(parsedManaged.body);
    const isLocallyDrifted = parsedManaged.header["content-hash"] !== currentHash;

    if (isLocallyDrifted && onConflict !== "overwrite") {
      conflicts.push({
        targetRelativePath: desiredFile.targetRelativePath,
        reason: "managed file drifted locally",
      });
      drifted.push(desiredFile.targetRelativePath);
      continue;
    }

    update.push({
      targetRelativePath: desiredFile.targetRelativePath,
      reason: isLocallyDrifted ? "overwrite drifted managed file" : "hub content changed",
    });

    if (isLocallyDrifted) {
      drifted.push(desiredFile.targetRelativePath);
    }
  }

  for (const entry of existingManagedEntries) {
    if (desiredMap.has(entry.targetRelativePath)) {
      continue;
    }

    if (entry.kind === "managed") {
      const isLocallyDrifted = entry.header["content-hash"] !== hashContent(entry.body);
      if (isLocallyDrifted && onConflict !== "overwrite") {
        conflicts.push({
          targetRelativePath: entry.targetRelativePath,
          reason: "managed file scheduled for deletion but drifted locally",
        });
        drifted.push(entry.targetRelativePath);
        continue;
      }

      remove.push({ targetRelativePath: entry.targetRelativePath, reason: "orphaned managed file" });
      continue;
    }

    unexpectedUnmanaged.push(entry.targetRelativePath);
  }

  for (const entry of existingManagedEntries) {
    if (entry.kind === "managed" && !desiredMap.has(entry.targetRelativePath)) {
      unexpectedManaged.push(entry.targetRelativePath);
    }
  }

  return {
    create,
    update,
    remove,
    unchanged,
    conflicts,
    diagnostics: {
      missingManaged,
      drifted: [...new Set(drifted)].sort(),
      unexpectedManaged: [...new Set(unexpectedManaged)].sort(),
      unexpectedUnmanaged: [...new Set(unexpectedUnmanaged)].sort(),
    },
  };
}

export async function applyProjectSync({ projectDir, desiredFiles, plan, preserveLocalOverrides }) {
  if (plan.conflicts.length > 0) {
    const summary = plan.conflicts
      .map((conflict) => `${conflict.targetRelativePath}: ${conflict.reason}`)
      .join("\n");
    throw new CliError(`Cannot apply sync because conflicts were detected:\n${summary}`);
  }

  const requiredDirs = getRequiredDirs(preserveLocalOverrides);

  for (const requiredDir of requiredDirs) {
    await ensureDir(fromRoot(projectDir, requiredDir));
  }

  const desiredMap = new Map(desiredFiles.map((file) => [file.targetRelativePath, file]));

  for (const operation of [...plan.create, ...plan.update]) {
    const file = desiredMap.get(operation.targetRelativePath);
    const targetPath = fromRoot(projectDir, operation.targetRelativePath);
    await ensureDir(path.dirname(targetPath));
    await fs.writeFile(targetPath, file.renderedContent, "utf8");
  }

  for (const operation of plan.remove) {
    const targetPath = fromRoot(projectDir, operation.targetRelativePath);
    if (await pathExists(targetPath)) {
      await fs.rm(targetPath, { force: true });
      await removeEmptyDirectories(path.dirname(targetPath), projectDir);
    }
  }

  for (const requiredDir of requiredDirs) {
    await ensureDir(fromRoot(projectDir, requiredDir));
  }
}

export async function validateManagedProject({ projectDir, desiredFiles, onConflict }) {
  return planProjectSync({ projectDir, desiredFiles, onConflict });
}

async function materializeDesiredFile(file, revision) {
  const body = await fs.readFile(file.sourcePath, "utf8");

  return {
    sourcePath: file.sourcePath,
    sourceRelativePath: file.sourceRelativePath,
    targetRelativePath: file.targetRelativePath,
    body,
    renderedContent: renderManagedFile({
      targetRelativePath: file.targetRelativePath,
      sourceRelativePath: file.sourceRelativePath,
      revision,
      body,
    }),
  };
}

async function scanManagedEntries(projectDir) {
  const entries = [];

  for (const managedRoot of MANAGED_ROOTS) {
    const absoluteRoot = fromRoot(projectDir, managedRoot);
    if (!(await pathExists(absoluteRoot))) {
      continue;
    }

    const stat = await fs.stat(absoluteRoot);
    const files = stat.isDirectory() ? await walkFiles(absoluteRoot) : [absoluteRoot];

    for (const absolutePath of files) {
      const targetRelativePath = path.relative(projectDir, absolutePath).split(path.sep).join("/");
      const content = await fs.readFile(absolutePath, "utf8");
      const parsedManaged = parseManagedFile({ targetRelativePath, content });

      if (parsedManaged) {
        entries.push({
          kind: "managed",
          targetRelativePath,
          header: parsedManaged.header,
          body: parsedManaged.body,
        });
        continue;
      }

      entries.push({
        kind: "unmanaged",
        targetRelativePath,
        content,
      });
    }
  }

  return entries.filter((entry) => entry.targetRelativePath !== ".github/ghcopilot-hub.json");
}

export function summarizePlan(plan) {
  return {
    create: plan.create.length,
    update: plan.update.length,
    remove: plan.remove.length,
    unchanged: plan.unchanged.length,
    conflicts: plan.conflicts.length,
    drifted: plan.diagnostics.drifted.length,
  };
}
