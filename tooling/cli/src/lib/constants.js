import path from "node:path";
import { fileURLToPath } from "node:url";

export const MANAGED_BY = "ghcopilot-hub";
export const MANIFEST_PATH = ".github/ghcopilot-hub.json";
export const DEFAULT_REVISION = "unknown";
export const HUB_CONTENT_DIR = "hub";

export const MANAGED_ROOTS = [
  ".github/agents",
  ".github/skills",
  ".github/instructions",
  ".github/prompts",
  ".github/copilot-instructions.md",
  ".vscode/settings.json",
];

export const REQUIRED_DIRS = [
  ".github",
  ".github/agents",
  ".github/skills",
  ".github/instructions",
  ".github/prompts",
  ".vscode",
];

export function getRequiredDirs(preserveLocalOverrides) {
  return preserveLocalOverrides ? [...REQUIRED_DIRS, ".github/local-overrides"] : [...REQUIRED_DIRS];
}

export function getDefaultHubDir() {
  return path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../..");
}

export function getHubContentPath(hubDir) {
  return path.join(hubDir, HUB_CONTENT_DIR);
}
