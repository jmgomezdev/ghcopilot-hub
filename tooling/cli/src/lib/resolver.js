import { CliError } from "./errors.js";
import { buildSkillIdLookup, canonicalizeSkillId, DEFAULT_SKILL_ID } from "./skill-ids.js";

const DEFAULT_SKILL_IDS = [DEFAULT_SKILL_ID];

export function resolveProjectState({ catalog, manifest }) {
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

  return {
    agents: catalog.agents,
    skills,
  };
}
