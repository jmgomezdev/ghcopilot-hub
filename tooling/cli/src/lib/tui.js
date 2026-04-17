import * as prompts from "@clack/prompts";

export function canUseInteractiveTui(context) {
  return (
    context.stdin === process.stdin &&
    context.stdout === process.stdout &&
    context.stderr === process.stderr &&
    Boolean(process.stdin?.isTTY) &&
    Boolean(process.stdout?.isTTY) &&
    typeof process.stdin?.setRawMode === "function"
  );
}

export async function promptInteractiveInitTui({ catalog, defaultSkillId, buildSelectableSkills }) {
  prompts.intro("ghcopilot-hub init");

  const selectedMode = await prompts.select({
    message: "Choose how to initialize the project.",
    options: [
      {
        value: "pack",
        label: "Pack + optional individual skills",
        hint: "default path",
      },
      {
        value: "agents-only",
        label: "Only agents",
        hint: `excludes ${defaultSkillId}`,
      },
      {
        value: "skills-only",
        label: "Individual skills without pack",
        hint: `keeps ${defaultSkillId}`,
      },
    ],
    initialValue: "pack",
  });

  if (prompts.isCancel(selectedMode)) {
    prompts.cancel("Init cancelled.");
    return { cancelled: true, reportedCancel: true };
  }

  if (selectedMode === "agents-only") {
    const selection = { agentsOnly: true, packs: [], skills: [] };
    return await confirmInteractiveInitSelection(selection);
  }

  const selectedPack =
    selectedMode === "pack"
      ? await prompts.select({
          message: "Choose one pack.",
          options: catalog.packs
            .map((pack) => pack.name)
            .sort()
            .map((packName) => ({ value: packName, label: packName })),
        })
      : null;

  if (prompts.isCancel(selectedPack)) {
    prompts.cancel("Init cancelled.");
    return { cancelled: true, reportedCancel: true };
  }

  const selectableSkills = buildSelectableSkills(selectedPack ?? null);
  if (selectedPack) {
    prompts.log.info(`Extra skills exclude those already included in ${selectedPack}.`);
  }
  prompts.log.info(
    "In multi-select, use Space to toggle a skill. Use Enter only when the selection is complete."
  );

  const selectedSkills =
    selectableSkills.length === 0
      ? []
      : await prompts.multiselect({
          message: "Select extra skills.",
          options: selectableSkills.map((skillId) => ({ value: skillId, label: skillId })),
          required: false,
        });

  if (prompts.isCancel(selectedSkills)) {
    prompts.cancel("Init cancelled.");
    return { cancelled: true, reportedCancel: true };
  }

  const selection = {
    agentsOnly: false,
    packs: selectedPack ? [selectedPack] : [],
    skills: [...selectedSkills].sort(),
  };

  return await confirmInteractiveInitSelection(selection);
}

export async function promptBootstrapAgentsTargetTui({
  defaultTarget,
  alternateTarget,
  operation,
}) {
  const overwrite = await prompts.confirm({
    message: `${defaultTarget} already exists during ${operation}. Overwrite it?`,
    initialValue: false,
  });

  if (prompts.isCancel(overwrite)) {
    prompts.cancel("Operation cancelled.");
    return alternateTarget;
  }

  return overwrite ? defaultTarget : alternateTarget;
}

async function confirmInteractiveInitSelection(selection) {
  prompts.log.step("Review your selection.");
  prompts.log.message(formatInteractiveInitSummary(selection), { symbol: "|" });

  const confirmed = await prompts.confirm({
    message: "Proceed with init?",
    initialValue: true,
  });

  if (prompts.isCancel(confirmed) || !confirmed) {
    prompts.cancel("Init cancelled.");
    return { cancelled: true, reportedCancel: true };
  }

  prompts.outro("Selection confirmed.");
  return selection;
}

export function formatInteractiveInitSummary(selection) {
  const hasPack = selection.packs.length > 0;
  const modeLabel = selection.agentsOnly
    ? "Only agents"
    : hasPack
      ? "Pack + optional individual skills"
      : "Individual skills without pack";

  return [
    "Selection summary",
    "-----------------",
    `Mode: ${modeLabel}`,
    `Pack: ${selection.packs[0] ?? "(none)"}`,
    `Default consumer skill: ${selection.agentsOnly ? "excluded" : "included"}`,
    `Bootstrap root AGENTS.md: ${hasPack ? "yes" : "no"}`,
    formatInteractiveInitSkillsSummary(selection.skills),
  ].join("\n");
}

function formatInteractiveInitSkillsSummary(skills) {
  if (skills.length === 0) {
    return "Extra skills: (none)";
  }

  return [`Extra skills (${skills.length}):`, ...skills.map((skillId) => `  - ${skillId}`)].join(
    "\n"
  );
}
