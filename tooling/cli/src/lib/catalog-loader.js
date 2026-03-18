import fs from "node:fs/promises";
import path from "node:path";
import { execFile } from "node:child_process";
import { promisify } from "node:util";

import { getHubContentPath, HUB_SKILL_PREFIX } from "./constants.js";
import { CliError } from "./errors.js";
import { parseFrontmatter, requireMetadataField } from "./frontmatter.js";
import { pathExists, relativeFrom, walkFiles } from "./fs-utils.js";

const execFileAsync = promisify(execFile);

export async function loadHubCatalog(hubDir) {
  const hubContentDir = getHubContentPath(hubDir);
  const [agents, skills, packs, revision] = await Promise.all([
    loadAgents(hubDir, hubContentDir),
    loadSkills(hubDir, hubContentDir),
    loadPacks(hubDir, hubContentDir),
    resolveRevision(hubDir),
  ]);

  const skillIds = new Set(skills.map((skill) => skill.id));
  for (const pack of packs) {
    for (const skillId of pack.skills) {
      if (!skillIds.has(skillId)) {
        throw new CliError(`Pack "${pack.name}" references unknown skill "${skillId}".`);
      }
    }
  }

  return {
    hubDir,
    agents,
    skills,
    packs,
    revision,
  };
}

async function loadAgents(hubDir, hubContentDir) {
  const agentsDir = path.join(hubContentDir, "agents");
  if (!(await pathExists(agentsDir))) {
    throw new CliError("Hub is missing the agents directory.");
  }

  const entries = await fs.readdir(agentsDir, { withFileTypes: true });
  const agents = [];

  for (const entry of entries) {
    if (!entry.isFile() || !entry.name.endsWith(".agent.md")) {
      continue;
    }

    const sourcePath = path.join(agentsDir, entry.name);
    const sourceText = await fs.readFile(sourcePath, "utf8");
    const { data } = parseFrontmatter(sourceText, relativeFrom(hubDir, sourcePath));
    const id = entry.name.replace(/\.agent\.md$/, "");

    agents.push({
      id,
      name: requireMetadataField(data, "name", relativeFrom(hubDir, sourcePath)),
      description: requireMetadataField(data, "description", relativeFrom(hubDir, sourcePath)),
      sourcePath,
      sourceRelativePath: relativeFrom(hubDir, sourcePath),
      targetRelativePath: `.github/agents/${entry.name}`,
    });
  }

  return agents.sort((left, right) => left.id.localeCompare(right.id));
}

async function loadSkills(hubDir, hubContentDir) {
  const skillsDir = path.join(hubContentDir, "skills");
  if (!(await pathExists(skillsDir))) {
    throw new CliError("Hub is missing the skills directory.");
  }

  const entries = await fs.readdir(skillsDir, { withFileTypes: true });
  const skills = [];

  for (const entry of entries) {
    if (!entry.isDirectory()) {
      continue;
    }

    if (!entry.name.startsWith(HUB_SKILL_PREFIX)) {
      throw new CliError(
        `Skill directory "hub/skills/${entry.name}" must use the "${HUB_SKILL_PREFIX}" prefix.`
      );
    }

    const skillDir = path.join(skillsDir, entry.name);
    const skillFile = path.join(skillDir, "SKILL.md");
    if (!(await pathExists(skillFile))) {
      throw new CliError(`Skill directory "hub/skills/${entry.name}" is missing SKILL.md.`);
    }

    const sourceText = await fs.readFile(skillFile, "utf8");
    const relativeSkillFile = relativeFrom(hubDir, skillFile);
    const { data } = parseFrontmatter(sourceText, relativeSkillFile);
    const allFiles = await walkFiles(skillDir);

    skills.push({
      id: entry.name,
      name: requireMetadataField(data, "name", relativeSkillFile),
      description: requireMetadataField(data, "description", relativeSkillFile),
      sourceDir: skillDir,
      files: allFiles
        .map((absolutePath) => ({
          sourcePath: absolutePath,
          sourceRelativePath: relativeFrom(hubDir, absolutePath),
          targetRelativePath: `.github/skills/${entry.name}/${relativeFrom(skillDir, absolutePath)}`,
        }))
        .sort((left, right) => left.targetRelativePath.localeCompare(right.targetRelativePath)),
    });
  }

  return skills.sort((left, right) => left.id.localeCompare(right.id));
}

async function loadPacks(hubDir, hubContentDir) {
  const packsDir = path.join(hubContentDir, "packs");
  if (!(await pathExists(packsDir))) {
    return [];
  }

  const entries = await fs.readdir(packsDir, { withFileTypes: true });
  const packs = [];

  for (const entry of entries) {
    if (!entry.isFile() || !entry.name.endsWith(".json")) {
      continue;
    }

    const packPath = path.join(packsDir, entry.name);
    const relativePackPath = relativeFrom(hubDir, packPath);
    let rawPack;
    try {
      rawPack = JSON.parse(await fs.readFile(packPath, "utf8"));
    } catch (error) {
      throw new CliError(`Pack file ${relativePackPath} is not valid JSON: ${error.message}`);
    }

    if (!rawPack || typeof rawPack !== "object") {
      throw new CliError(`Pack file ${relativePackPath} must contain an object.`);
    }

    if (typeof rawPack.name !== "string" || rawPack.name.trim() === "") {
      throw new CliError(`Pack file ${relativePackPath} must contain a non-empty "name".`);
    }

    if (
      !Array.isArray(rawPack.skills) ||
      rawPack.skills.some((skill) => typeof skill !== "string" || skill.trim() === "")
    ) {
      throw new CliError(
        `Pack file ${relativePackPath} must contain a "skills" array of non-empty strings.`
      );
    }

    packs.push({
      name: rawPack.name.trim(),
      skills: [...new Set(rawPack.skills.map((skill) => skill.trim()))].sort(),
      sourcePath: packPath,
      sourceRelativePath: relativePackPath,
    });
  }

  return packs.sort((left, right) => left.name.localeCompare(right.name));
}

async function resolveRevision(hubDir) {
  try {
    const { stdout } = await execFileAsync("git", ["-C", hubDir, "rev-parse", "HEAD"]);
    return stdout.trim() || "unknown";
  } catch {
    return "unknown";
  }
}
