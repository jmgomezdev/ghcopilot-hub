import path from "node:path";

import { loadHubCatalog } from "./lib/catalog-loader.js";
import {
  ALTERNATE_BOOTSTRAP_AGENTS_TARGET,
  DEFAULT_BOOTSTRAP_AGENTS_TARGET,
  getDefaultHubDir,
} from "./lib/constants.js";
import { CliError } from "./lib/errors.js";
import { ensureManifest, readManifest, writeManifest } from "./lib/manifest.js";
import { fromRoot, pathExists } from "./lib/fs-utils.js";
import { resolveProjectState } from "./lib/resolver.js";
import { buildSkillIdLookup, canonicalizeSkillId, canonicalizeSkillIds } from "./lib/skill-ids.js";
import {
  applyProjectSync,
  createDesiredFiles,
  summarizePlan,
  validateManagedProject,
} from "./lib/sync-engine.js";

export async function runCli(argv, context) {
  try {
    const parsed = parseArgv(argv);

    if (parsed.options.help) {
      writeUsage(context.stdout);
      return 0;
    }

    const hubDir = path.resolve(parsed.options.hubDir ?? getDefaultHubDir());

    if (parsed.command === "doctor" && parsed.options.hubOnly) {
      const catalog = await loadHubCatalog(hubDir);
      writeJsonOrText(
        context.stdout,
        parsed.options.json,
        {
          status: "ok",
          hubDir,
          agents: catalog.agents.length,
          skills: catalog.skills.length,
          packs: catalog.packs.length,
        },
        formatHubDoctor(catalog, hubDir)
      );
      return 0;
    }

    if (!parsed.command) {
      writeUsage(context.stderr);
      return 1;
    }

    const projectDir = path.resolve(parsed.options.projectDir ?? context.cwd);
    const catalog = await loadHubCatalog(hubDir);

    switch (parsed.command) {
      case "init":
        return await runInit({ parsed, context, projectDir, catalog });
      case "update":
        return await runUpdate({ parsed, context, projectDir, catalog });
      case "list":
        return await runList({ parsed, context, catalog });
      case "diff":
        return await runDiff({ parsed, context, projectDir, catalog });
      case "doctor":
        return await runDoctor({ parsed, context, projectDir, catalog });
      case "add":
        return await runMutatingManifestCommand({
          action: "add",
          parsed,
          context,
          projectDir,
          catalog,
        });
      case "remove":
        return await runMutatingManifestCommand({
          action: "remove",
          parsed,
          context,
          projectDir,
          catalog,
        });
      default:
        throw new CliError(`Unknown command "${parsed.command}".`);
    }
  } catch (error) {
    const cliError = error instanceof CliError ? error : new CliError(error.message);
    context.stderr.write(`${cliError.message}\n`);
    return cliError.exitCode;
  }
}

async function runInit({ parsed, context, projectDir, catalog }) {
  const manifest = await ensureManifest(projectDir);
  const skillIdLookup = buildSkillIdLookup(catalog.skills);
  let resolvedBootstrapAgentsTargetThisRun = false;
  let bootstrapOverwriteConfirmedThisRun = false;

  canonicalizeManifestSkillSelections(manifest, skillIdLookup);

  manifest.packs = resolveNextPackSelection({
    currentPacks: manifest.packs,
    requestedPacks: parsed.options.packs ?? [],
    action: "init",
  });
  manifest.skills = mergeUnique(
    manifest.skills,
    canonicalizeSkillIds(parsed.options.skills ?? [], skillIdLookup)
  );
  manifest.excludeSkills = manifest.excludeSkills.filter(
    (skillId) => !manifest.skills.includes(skillId)
  );

  if (manifest.packs.length === 0) {
    manifest.settings.bootstrapAgentsTarget = null;
  }

  if (manifest.packs.length > 0 && !manifest.settings.bootstrapAgentsTarget) {
    const hadExistingBootstrapAgentsFile = await pathExists(
      fromRoot(projectDir, DEFAULT_BOOTSTRAP_AGENTS_TARGET)
    );
    manifest.settings.bootstrapAgentsTarget = await resolveBootstrapAgentsTarget({
      context,
      projectDir,
      json: parsed.options.json,
    });
    resolvedBootstrapAgentsTargetThisRun = true;
    bootstrapOverwriteConfirmedThisRun =
      hadExistingBootstrapAgentsFile &&
      manifest.settings.bootstrapAgentsTarget === DEFAULT_BOOTSTRAP_AGENTS_TARGET;
  }

  await writeManifest(projectDir, manifest);
  return syncFromManifest({
    context,
    projectDir,
    catalog,
    manifest,
    force: parsed.options.force,
    json: parsed.options.json,
    operation: "init",
    skipBootstrapOverwritePrompt: resolvedBootstrapAgentsTargetThisRun,
    bootstrapOverwriteConfirmed: bootstrapOverwriteConfirmedThisRun,
  });
}

async function runUpdate({ parsed, context, projectDir, catalog }) {
  const manifest = await readManifest(projectDir);
  return syncFromManifest({
    context,
    projectDir,
    catalog,
    manifest,
    force: parsed.options.force,
    json: parsed.options.json,
    operation: "update",
  });
}

async function runList({ parsed, context, catalog }) {
  const scope = normalizeListScope(parsed.subject);
  const payload = {
    hubDir: catalog.hubDir,
    revision: catalog.revision,
    counts: {
      packs: catalog.packs.length,
      skills: catalog.skills.length,
    },
  };

  if (scope !== "skills") {
    payload.packs = catalog.packs.map((pack) => ({
      name: pack.name,
      skills: pack.skills,
    }));
  }

  if (scope !== "packs") {
    payload.skills = catalog.skills.map((skill) => ({
      id: skill.id,
      name: skill.name,
    }));
  }

  writeJsonOrText(context.stdout, parsed.options.json, payload, formatCatalogList(payload));
  return 0;
}

async function runDiff({ parsed, context, projectDir, catalog }) {
  const manifest = await readManifest(projectDir);
  const report = await buildProjectReport({
    projectDir,
    catalog,
    manifest,
    force: parsed.options.force,
  });

  writeJsonOrText(context.stdout, parsed.options.json, report, formatSyncPlan("Diff", report.plan));

  return report.plan.conflicts.length > 0 ? 2 : 0;
}

async function runDoctor({ parsed, context, projectDir, catalog }) {
  const manifest = await readManifest(projectDir);
  const report = await buildProjectReport({
    projectDir,
    catalog,
    manifest,
    force: parsed.options.force,
  });
  const hasIssues =
    report.plan.conflicts.length > 0 ||
    report.plan.diagnostics.missingManaged.length > 0 ||
    report.plan.diagnostics.drifted.length > 0 ||
    report.plan.diagnostics.unexpectedManaged.length > 0 ||
    report.plan.diagnostics.unexpectedUnmanaged.length > 0;

  writeJsonOrText(
    context.stdout,
    parsed.options.json,
    {
      ...report,
      status: hasIssues ? "issues-found" : "ok",
    },
    formatDoctorReport(report, hasIssues)
  );

  return hasIssues ? 2 : 0;
}

async function runMutatingManifestCommand({ action, parsed, context, projectDir, catalog }) {
  if (!parsed.subject || !parsed.name) {
    throw new CliError(`Usage: ghcopilot-hub ${action} <pack|skill> <name>`);
  }

  const manifest = await readManifest(projectDir);
  const skillIdLookup = buildSkillIdLookup(catalog.skills);

  canonicalizeManifestSkillSelections(manifest, skillIdLookup);

  if (parsed.subject === "pack") {
    manifest.packs =
      action === "add"
        ? resolveNextPackSelection({
            currentPacks: manifest.packs,
            requestedPacks: [parsed.name],
            action: "add",
          })
        : manifest.packs.filter((value) => value !== parsed.name);

    if (manifest.packs.length === 0) {
      manifest.settings.bootstrapAgentsTarget = null;
    }
  } else if (parsed.subject === "skill") {
    const canonicalSkillName = canonicalizeSkillId(parsed.name, skillIdLookup) ?? parsed.name;

    if (action === "add") {
      manifest.skills = mergeUnique(manifest.skills, [canonicalSkillName]);
      manifest.excludeSkills = manifest.excludeSkills.filter(
        (value) => value !== canonicalSkillName
      );
    } else {
      manifest.skills = manifest.skills.filter((value) => value !== canonicalSkillName);
      manifest.excludeSkills = mergeUnique(manifest.excludeSkills, [canonicalSkillName]);
    }
  } else {
    throw new CliError(`Unknown subject "${parsed.subject}". Use "pack" or "skill".`);
  }

  await writeManifest(projectDir, manifest);
  return syncFromManifest({
    context,
    projectDir,
    catalog,
    manifest,
    force: parsed.options.force,
    json: parsed.options.json,
    operation: action,
  });
}

async function syncFromManifest({
  context,
  projectDir,
  catalog,
  manifest,
  force,
  json,
  operation,
  skipBootstrapOverwritePrompt = false,
  bootstrapOverwriteConfirmed = false,
}) {
  const effectiveManifest = structuredClone(manifest);
  let report = await buildProjectReport({
    projectDir,
    catalog,
    manifest: effectiveManifest,
    force,
  });

  if (!skipBootstrapOverwritePrompt) {
    const bootstrapDecision = await maybeResolveBootstrapAgentsOverwrite({
      context,
      projectDir,
      report,
      manifest: effectiveManifest,
      force,
      json,
      operation,
    });

    if (bootstrapDecision.targetChanged) {
      await writeManifest(projectDir, effectiveManifest);
      report = await buildProjectReport({
        projectDir,
        catalog,
        manifest: effectiveManifest,
        force,
      });
    } else if (bootstrapDecision.overwriteConfirmed) {
      report = applyBootstrapOverwriteConfirmation(report);
    }
  } else if (bootstrapOverwriteConfirmed) {
    report = applyBootstrapOverwriteConfirmation(report);
  }

  const applicablePlan = getApplicablePlan(report.plan);

  if (report.plan.conflicts.length > 0 && !hasPendingOperations(applicablePlan)) {
    writeJsonOrText(context.stdout, json, report, formatSyncPlan("Sync blocked", report.plan));
    return 2;
  }

  if (hasPendingOperations(applicablePlan)) {
    await applyProjectSync({
      projectDir,
      desiredFiles: report.desiredFiles,
      plan: applicablePlan,
    });
  }

  writeJsonOrText(
    context.stdout,
    json,
    report,
    formatSyncPlan(
      report.plan.conflicts.length > 0 ? "Sync applied with conflicts" : "Sync applied",
      report.plan
    )
  );
  return report.plan.conflicts.length > 0 ? 2 : 0;
}

async function buildProjectReport({ projectDir, catalog, manifest, force }) {
  const effectiveManifest = structuredClone(manifest);
  if (force) {
    effectiveManifest.settings.onConflict = "overwrite";
  }

  const resolvedState = resolveProjectState({
    catalog,
    manifest: effectiveManifest,
    includeBootstrapAgents: Boolean(effectiveManifest.settings.bootstrapAgentsTarget),
  });
  const desiredFiles = await createDesiredFiles({
    resolvedState,
    revision: catalog.revision,
  });
  const plan = await validateManagedProject({
    projectDir,
    desiredFiles,
    onConflict: effectiveManifest.settings.onConflict,
  });

  return {
    projectDir,
    revision: catalog.revision,
    manifest: effectiveManifest,
    resolved: {
      bootstrapFiles: resolvedState.bootstrapFiles.map((file) => file.targetRelativePath),
      agents: resolvedState.agents.map((agent) => agent.id),
      skills: resolvedState.skills.map((skill) => skill.id),
    },
    desiredFiles,
    plan,
    summary: summarizePlan(plan),
  };
}

function parseArgv(argv) {
  const [firstToken, maybeSubject, maybeName, ...rest] = argv;
  const command = firstToken?.startsWith("--") ? null : firstToken;
  const options = {
    packs: [],
    skills: [],
    json: false,
    force: false,
    hubOnly: false,
    help: false,
  };

  const args = [];
  const tokens =
    command === "add" || command === "remove"
      ? [maybeSubject, maybeName, ...rest]
      : command
        ? [maybeSubject, maybeName, ...rest].filter((token) => token !== undefined)
        : argv;

  for (let index = 0; index < tokens.length; index += 1) {
    const token = tokens[index];
    if (!token) {
      continue;
    }

    if (!token.startsWith("--")) {
      args.push(token);
      continue;
    }

    switch (token) {
      case "--project-dir":
        options.projectDir = tokens[index + 1];
        index += 1;
        break;
      case "--hub-dir":
        options.hubDir = tokens[index + 1];
        index += 1;
        break;
      case "--pack":
        options.packs.push(tokens[index + 1]);
        index += 1;
        break;
      case "--skill":
        options.skills.push(tokens[index + 1]);
        index += 1;
        break;
      case "--json":
        options.json = true;
        break;
      case "--force":
        options.force = true;
        break;
      case "--hub-only":
        options.hubOnly = true;
        break;
      case "--help":
        options.help = true;
        break;
      default:
        throw new CliError(`Unknown option "${token}".`);
    }
  }

  return {
    command,
    subject: command === "add" || command === "remove" || command === "list" ? args[0] : null,
    name: command === "add" || command === "remove" ? args[1] : null,
    options,
  };
}

function writeJsonOrText(stream, asJson, payload, text) {
  if (asJson) {
    const serializable = JSON.parse(JSON.stringify(payload, replacer));
    stream.write(`${JSON.stringify(serializable, null, 2)}\n`);
    return;
  }

  stream.write(`${text}\n`);
}

function resolveNextPackSelection({ currentPacks, requestedPacks, action }) {
  const normalizedRequestedPacks = [...new Set(requestedPacks.filter(Boolean))];

  if (normalizedRequestedPacks.length === 0) {
    return [...currentPacks];
  }

  if (normalizedRequestedPacks.length > 1) {
    throw new CliError(`Command "${action}" supports only one pack per project.`);
  }

  if (currentPacks.length === 0) {
    return normalizedRequestedPacks;
  }

  if (currentPacks[0] === normalizedRequestedPacks[0]) {
    return [...currentPacks];
  }

  throw new CliError(
    `Project already uses pack "${currentPacks[0]}". Remove it before selecting "${normalizedRequestedPacks[0]}".`
  );
}

async function resolveBootstrapAgentsTarget({ context, projectDir, json }) {
  if (!(await pathExists(fromRoot(projectDir, DEFAULT_BOOTSTRAP_AGENTS_TARGET)))) {
    return DEFAULT_BOOTSTRAP_AGENTS_TARGET;
  }

  return promptForBootstrapAgentsTarget({
    context,
    json,
    operation: "init",
  });
}

async function maybeResolveBootstrapAgentsOverwrite({
  context,
  projectDir,
  report,
  manifest,
  force,
  json,
  operation,
}) {
  const currentTarget = manifest.settings.bootstrapAgentsTarget;
  if (currentTarget !== DEFAULT_BOOTSTRAP_AGENTS_TARGET || force) {
    return { overwriteConfirmed: false, targetChanged: false };
  }

  const targetPath = fromRoot(projectDir, DEFAULT_BOOTSTRAP_AGENTS_TARGET);
  if (!(await pathExists(targetPath))) {
    return { overwriteConfirmed: false, targetChanged: false };
  }

  const bootstrapOperation = getBootstrapPlanOperation(report.plan);
  if (!bootstrapOperation) {
    return { overwriteConfirmed: false, targetChanged: false };
  }

  const chosenTarget = await promptForBootstrapAgentsTarget({ context, json, operation });
  if (chosenTarget === DEFAULT_BOOTSTRAP_AGENTS_TARGET) {
    return { overwriteConfirmed: true, targetChanged: false };
  }

  manifest.settings.bootstrapAgentsTarget = chosenTarget;
  return { overwriteConfirmed: false, targetChanged: true };
}

async function promptForBootstrapAgentsTarget({ context, json, operation }) {
  if (json || !context.stdin?.isTTY || typeof context.stdin.once !== "function") {
    throw new CliError(
      `Cannot decide how to handle ${DEFAULT_BOOTSTRAP_AGENTS_TARGET} during ${operation} in non-interactive mode. Run the command in a terminal to choose whether to overwrite it or create ${ALTERNATE_BOOTSTRAP_AGENTS_TARGET}.`
    );
  }

  context.stdout.write(`${DEFAULT_BOOTSTRAP_AGENTS_TARGET} already exists. Overwrite it? [y/N] `);

  const answer = await readSingleLine(context.stdin);
  const normalizedAnswer = answer.trim().toLowerCase();

  return normalizedAnswer === "y" || normalizedAnswer === "yes"
    ? DEFAULT_BOOTSTRAP_AGENTS_TARGET
    : ALTERNATE_BOOTSTRAP_AGENTS_TARGET;
}

function readSingleLine(stdin) {
  return new Promise((resolve, reject) => {
    const onData = (chunk) => {
      cleanup();
      resolve(String(chunk));
    };
    const onError = (error) => {
      cleanup();
      reject(error);
    };
    const cleanup = () => {
      stdin.removeListener?.("data", onData);
      stdin.removeListener?.("error", onError);
      stdin.pause?.();
    };

    stdin.once("data", onData);
    stdin.once?.("error", onError);
    stdin.resume?.();
  });
}

function getBootstrapPlanOperation(plan) {
  for (const groupName of ["update", "conflicts"]) {
    const operation = plan[groupName].find(
      (entry) => entry.targetRelativePath === DEFAULT_BOOTSTRAP_AGENTS_TARGET
    );
    if (operation) {
      return { groupName, operation };
    }
  }

  return null;
}

function applyBootstrapOverwriteConfirmation(report) {
  const bootstrapConflictIndex = report.plan.conflicts.findIndex(
    (entry) => entry.targetRelativePath === DEFAULT_BOOTSTRAP_AGENTS_TARGET
  );

  if (bootstrapConflictIndex === -1) {
    return report;
  }

  const conflicts = [...report.plan.conflicts];
  conflicts.splice(bootstrapConflictIndex, 1);

  return {
    ...report,
    plan: {
      ...report.plan,
      conflicts,
      update: [
        ...report.plan.update,
        {
          targetRelativePath: DEFAULT_BOOTSTRAP_AGENTS_TARGET,
          reason: "overwrite confirmed by user",
        },
      ].sort((left, right) => left.targetRelativePath.localeCompare(right.targetRelativePath)),
    },
    summary: summarizePlan({
      ...report.plan,
      conflicts,
      update: [
        ...report.plan.update,
        {
          targetRelativePath: DEFAULT_BOOTSTRAP_AGENTS_TARGET,
          reason: "overwrite confirmed by user",
        },
      ],
    }),
  };
}

function replacer(key, value) {
  if (key === "desiredFiles") {
    return value.map((file) => ({
      sourceRelativePath: file.sourceRelativePath,
      targetRelativePath: file.targetRelativePath,
    }));
  }

  return value;
}

function formatHubDoctor(catalog, hubDir) {
  return [
    "Hub validation OK",
    `Hub: ${hubDir}`,
    `Agents: ${catalog.agents.length}`,
    `Skills: ${catalog.skills.length}`,
    `Packs: ${catalog.packs.length}`,
    `Revision: ${catalog.revision}`,
  ].join("\n");
}

function normalizeListScope(subject) {
  if (!subject) {
    return "all";
  }

  if (subject === "pack" || subject === "packs") {
    return "packs";
  }

  if (subject === "skill" || subject === "skills") {
    return "skills";
  }

  throw new CliError(`Unknown list target "${subject}". Use "packs" or "skills".`);
}

function formatCatalogList(payload) {
  const sections = [
    "Catalog",
    `Hub: ${payload.hubDir}`,
    `Revision: ${payload.revision}`,
    `Packs: ${payload.counts.packs}`,
    `Skills: ${payload.counts.skills}`,
  ];

  if (payload.packs) {
    sections.push("\nPacks:");
    for (const pack of payload.packs) {
      sections.push(`- ${pack.name} (${pack.skills.join(", ") || "(empty)"})`);
    }
  }

  if (payload.skills) {
    sections.push("\nSkills:");
    for (const skill of payload.skills) {
      sections.push(skill.id === skill.name ? `- ${skill.id}` : `- ${skill.id}: ${skill.name}`);
    }
  }

  return sections.join("\n");
}

function formatSyncPlan(title, plan) {
  const sections = [
    title,
    `Create: ${plan.create.length}`,
    `Update: ${plan.update.length}`,
    `Remove: ${plan.remove.length}`,
    `Conflicts: ${plan.conflicts.length}`,
  ];

  for (const group of [
    ["Create", plan.create],
    ["Update", plan.update],
    ["Remove", plan.remove],
    ["Conflicts", plan.conflicts],
  ]) {
    if (group[1].length === 0) {
      continue;
    }

    sections.push(`\n${group[0]}:`);
    for (const item of group[1]) {
      sections.push(`- ${item.targetRelativePath}${item.reason ? ` (${item.reason})` : ""}`);
    }
  }

  return sections.join("\n");
}

function formatDoctorReport(report, hasIssues) {
  const sections = [
    hasIssues ? "Doctor found issues" : "Doctor OK",
    `Revision: ${report.revision}`,
    `Agents: ${report.resolved.agents.join(", ")}`,
    `Skills: ${report.resolved.skills.join(", ") || "(none)"}`,
    `Create: ${report.plan.create.length}`,
    `Update: ${report.plan.update.length}`,
    `Remove: ${report.plan.remove.length}`,
    `Conflicts: ${report.plan.conflicts.length}`,
  ];

  appendList(sections, "Drifted managed files", report.plan.diagnostics.drifted);
  appendList(sections, "Missing managed files", report.plan.diagnostics.missingManaged);
  appendList(sections, "Unexpected managed files", report.plan.diagnostics.unexpectedManaged);
  appendList(sections, "Unexpected unmanaged files", report.plan.diagnostics.unexpectedUnmanaged);

  return sections.join("\n");
}

function appendList(buffer, title, values) {
  if (values.length === 0) {
    return;
  }

  buffer.push(`\n${title}:`);
  for (const value of values) {
    buffer.push(`- ${value}`);
  }
}

function canonicalizeManifestSkillSelections(manifest, skillIdLookup) {
  manifest.skills = canonicalizeSkillIds(manifest.skills, skillIdLookup);
  manifest.excludeSkills = canonicalizeSkillIds(manifest.excludeSkills, skillIdLookup).filter(
    (skillId) => !manifest.skills.includes(skillId)
  );
}

function mergeUnique(currentValues, nextValues) {
  return [...new Set([...currentValues, ...nextValues])].sort();
}

function getApplicablePlan(plan) {
  const conflictedPaths = new Set(plan.conflicts.map((conflict) => conflict.targetRelativePath));
  const filterOperation = (operation) => !conflictedPaths.has(operation.targetRelativePath);

  return {
    ...plan,
    create: plan.create.filter(filterOperation),
    update: plan.update.filter(filterOperation),
    remove: plan.remove.filter(filterOperation),
    conflicts: [],
  };
}

function hasPendingOperations(plan) {
  return plan.create.length > 0 || plan.update.length > 0 || plan.remove.length > 0;
}

function writeUsage(stream) {
  stream.write(
    [
      "Usage:",
      "  ghcopilot-hub --help",
      "  ghcopilot-hub init [--pack <id>] [--skill <id>] [--project-dir <path>] [--force] [--json]",
      "  ghcopilot-hub update [--project-dir <path>] [--force] [--json]",
      "  ghcopilot-hub list [packs|skills] [--hub-dir <path>] [--json]",
      "  ghcopilot-hub add <pack|skill> <name> [--project-dir <path>] [--force] [--json]",
      "  ghcopilot-hub remove <pack|skill> <name> [--project-dir <path>] [--force] [--json]",
      "  ghcopilot-hub diff [--project-dir <path>] [--force] [--json]",
      "  ghcopilot-hub doctor [--project-dir <path>] [--force] [--json]",
      "  ghcopilot-hub doctor --hub-only [--json]",
      "",
      "Options:",
      "  --help  Show this help text",
      "",
      "Examples:",
      "  ghcopilot-hub init",
      "  ghcopilot-hub init --pack spa-tanstack",
      "  ghcopilot-hub init --skill ghcopilot-hub-mermaid-expert",
      "",
      "Notes:",
      "  init without --pack syncs all hub agents and only the default ghcopilot-hub-consumer skill.",
    ].join("\n")
  );
}
