import { CliError } from "./errors.js";

const DEFAULT_SKILL_IDS = ["ghcopilot-hub-consumer"];

export function resolveProjectState({ catalog, manifest }) {
  const packMap = new Map(catalog.packs.map((pack) => [pack.name, pack]));
  const skillMap = new Map(catalog.skills.map((skill) => [skill.id, skill]));

  const resolvedSkillIds = new Set();

  for (const skillId of DEFAULT_SKILL_IDS) {
    if (!skillMap.has(skillId)) {
      throw new CliError(`Hub is missing required default skill "${skillId}".`);
    }

    resolvedSkillIds.add(skillId);
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
    if (!skillMap.has(skillId)) {
      throw new CliError(`Manifest references unknown skill "${skillId}".`);
    }

    resolvedSkillIds.add(skillId);
  }

  for (const skillId of manifest.excludeSkills) {
    if (!skillMap.has(skillId)) {
      throw new CliError(`Manifest excludes unknown skill "${skillId}".`);
    }

    resolvedSkillIds.delete(skillId);
  }

  const skills = [...resolvedSkillIds].sort().map((skillId) => skillMap.get(skillId));

  return {
    agents: catalog.agents,
    skills,
  };
}
