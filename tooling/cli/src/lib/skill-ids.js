import { HUB_SKILL_PREFIX } from "./constants.js";

export const DEFAULT_SKILL_ID = `${HUB_SKILL_PREFIX}consumer`;

export function buildSkillIdLookup(skills) {
  const lookup = new Map();

  for (const skill of skills) {
    lookup.set(skill.id, skill.id);

    const legacySkillId = toLegacySkillId(skill.id);
    if (legacySkillId && !lookup.has(legacySkillId)) {
      lookup.set(legacySkillId, skill.id);
    }
  }

  return lookup;
}

export function canonicalizeSkillId(skillId, skillIdLookup) {
  return skillIdLookup.get(skillId) ?? null;
}

export function canonicalizeSkillIds(skillIds, skillIdLookup) {
  return [
    ...new Set(skillIds.map((skillId) => canonicalizeSkillId(skillId, skillIdLookup) ?? skillId)),
  ].sort();
}

function toLegacySkillId(skillId) {
  if (!skillId.startsWith(HUB_SKILL_PREFIX) || skillId === DEFAULT_SKILL_ID) {
    return null;
  }

  return skillId.slice(HUB_SKILL_PREFIX.length);
}
