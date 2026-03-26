import path from "node:path";
import { fileURLToPath } from "node:url";

export const MANAGED_BY = "ghcopilot-hub";
export const MANIFEST_PATH = ".github/ghcopilot-hub.json";
export const DEFAULT_REVISION = "unknown";
export const HUB_CONTENT_DIR = "hub";
export const HUB_SKILL_PREFIX = "ghcopilot-hub-";
export const HUB_BOOTSTRAP_DIR = "bootstrap";
export const DEFAULT_BOOTSTRAP_AGENTS_TARGET = "AGENTS.md";
export const ALTERNATE_BOOTSTRAP_AGENTS_TARGET = "AGENTS-base.md";

export const MANAGED_ROOTS = [
  "AGENTS-base.md",
  ".github/agents",
  ".github/skills",
  ".github/instructions",
  ".github/prompts",
  ".github/copilot-instructions.md",
  ".vscode/settings.json",
];

export const REQUIRED_DIRS = [".github", ".github/agents", ".github/skills"];

export function getDefaultHubDir() {
  return path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../../..");
}

export function getHubContentPath(hubDir) {
  return path.join(hubDir, HUB_CONTENT_DIR);
}
