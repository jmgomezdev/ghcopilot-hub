import fs from "node:fs/promises";
import path from "node:path";

import { CliError } from "./errors.js";
import { MANIFEST_PATH } from "./constants.js";
import { ensureDir, fromRoot, pathExists, readTextIfExists } from "./fs-utils.js";

export const DEFAULT_MANIFEST = {
  packs: [],
  skills: [],
  excludeSkills: [],
  settings: {
    onConflict: "fail",
  },
};

export function normalizeManifest(rawManifest) {
  const manifest = structuredClone(DEFAULT_MANIFEST);
  const raw = rawManifest ?? {};

  manifest.packs = normalizeStringArray(raw.packs, "packs");
  manifest.skills = normalizeStringArray(raw.skills, "skills");
  manifest.excludeSkills = normalizeStringArray(raw.excludeSkills, "excludeSkills");

  const rawSettings = raw.settings ?? {};
  const onConflict = rawSettings.onConflict ?? DEFAULT_MANIFEST.settings.onConflict;

  if (!["fail", "overwrite"].includes(onConflict)) {
    throw new CliError('Manifest setting "settings.onConflict" must be "fail" or "overwrite".');
  }

  manifest.settings = {
    onConflict,
  };

  return manifest;
}

export async function readManifest(projectDir, options = {}) {
  const manifestPath = fromRoot(projectDir, MANIFEST_PATH);
  const manifestText = await readTextIfExists(manifestPath);

  if (manifestText === null) {
    if (options.allowMissing) {
      return null;
    }

    throw new CliError(`Manifest not found at ${MANIFEST_PATH}. Run "ghcopilot-hub init" first.`);
  }

  let parsed;
  try {
    parsed = JSON.parse(manifestText);
  } catch (error) {
    throw new CliError(`Manifest at ${MANIFEST_PATH} is not valid JSON: ${error.message}`);
  }

  return normalizeManifest(parsed);
}

export async function writeManifest(projectDir, manifest) {
  const manifestPath = fromRoot(projectDir, MANIFEST_PATH);
  await ensureDir(path.dirname(manifestPath));
  await fs.writeFile(
    manifestPath,
    `${JSON.stringify(normalizeManifest(manifest), null, 2)}\n`,
    "utf8"
  );
}

export async function ensureManifest(projectDir) {
  const manifestPath = fromRoot(projectDir, MANIFEST_PATH);
  if (!(await pathExists(manifestPath))) {
    await writeManifest(projectDir, DEFAULT_MANIFEST);
  }

  return readManifest(projectDir);
}

function normalizeStringArray(value, fieldName) {
  if (value === undefined) {
    return [];
  }

  if (!Array.isArray(value)) {
    throw new CliError(`Manifest field "${fieldName}" must be an array of strings.`);
  }

  return [
    ...new Set(
      value.map((item) => {
        if (typeof item !== "string" || item.trim() === "") {
          throw new CliError(`Manifest field "${fieldName}" must contain only non-empty strings.`);
        }

        return item.trim();
      })
    ),
  ].sort();
}
