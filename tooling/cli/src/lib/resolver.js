import { ALTERNATE_BOOTSTRAP_AGENTS_TARGET, DEFAULT_BOOTSTRAP_AGENTS_TARGET } from "./constants.js";
import { CliError } from "./errors.js";
import { buildSkillIdLookup, canonicalizeSkillId, DEFAULT_SKILL_ID } from "./skill-ids.js";

const DEFAULT_SKILL_IDS = [DEFAULT_SKILL_ID];

export function resolveProjectState({ catalog, manifest, includeBootstrapAgents = false }) {
  const packMap = new Map(catalog.packs.map((pack) => [pack.name, pack]));
  const skillMap = new Map(catalog.skills.map((skill) => [skill.id, skill]));
  const skillIdLookup = buildSkillIdLookup(catalog.skills);

  const resolvedSkillIds = new Set();

  for (const skillId of DEFAULT_SKILL_IDS) {
    const canonicalSkillId = canonicalizeSkillId(skillId, skillIdLookup);
    if (!canonicalSkillId || !skillMap.has(canonicalSkillId)) {
      throw new CliError(`Hub is missing required default skill "${skillId}".`);
    }

    resolvedSkillIds.add(canonicalSkillId);
  }

  for (const packName of manifest.packs) {
    const pack = packMap.get(packName);
    if (!pack) {
      throw new CliError(`Manifest references unknown pack "${packName}".`);
    }

    for (const skillId of pack.skills) {
      resolvedSkillIds.add(skillId);
    }
  }

  for (const skillId of manifest.skills) {
    const canonicalSkillId = canonicalizeSkillId(skillId, skillIdLookup);
    if (!canonicalSkillId || !skillMap.has(canonicalSkillId)) {
      throw new CliError(`Manifest references unknown skill "${skillId}".`);
    }

    resolvedSkillIds.add(canonicalSkillId);
  }

  for (const skillId of manifest.excludeSkills) {
    const canonicalSkillId = canonicalizeSkillId(skillId, skillIdLookup);
    if (!canonicalSkillId || !skillMap.has(canonicalSkillId)) {
      throw new CliError(`Manifest excludes unknown skill "${skillId}".`);
    }

    resolvedSkillIds.delete(canonicalSkillId);
  }

  const skills = [...resolvedSkillIds].sort().map((skillId) => skillMap.get(skillId));

  const bootstrapFiles = [];
  const bootstrapAgentsTarget = manifest.settings.bootstrapAgentsTarget;
  if (
    includeBootstrapAgents &&
    bootstrapAgentsTarget &&
    bootstrapAgentsTarget !== DEFAULT_BOOTSTRAP_AGENTS_TARGET &&
    bootstrapAgentsTarget !== ALTERNATE_BOOTSTRAP_AGENTS_TARGET
  ) {
    throw new CliError(
      `Manifest references unknown bootstrap agents target "${bootstrapAgentsTarget}".`
    );
  }

  if (bootstrapAgentsTarget) {
    if (!catalog.bootstrapFiles?.agentsBase) {
      throw new CliError("Hub is missing the bootstrap AGENTS definition.");
    }

    bootstrapFiles.push({
      ...catalog.bootstrapFiles.agentsBase,
      targetRelativePath: bootstrapAgentsTarget,
    });
  }

  return {
    agents: catalog.agents,
    skills,
    bootstrapFiles,
  };
}
