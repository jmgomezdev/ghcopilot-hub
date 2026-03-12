import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { runCli } from "../src/cli.js";

export const HUB_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");

export async function createTempProject() {
  return fs.mkdtemp(path.join(os.tmpdir(), "ghcopilot-hub-test-"));
}

export async function readProjectFile(projectDir, targetRelativePath) {
  const absolutePath = path.join(projectDir, ...targetRelativePath.split("/"));
  return fs.readFile(absolutePath, "utf8");
}

export async function fileExists(projectDir, targetRelativePath) {
  try {
    await fs.access(path.join(projectDir, ...targetRelativePath.split("/")));
    return true;
  } catch {
    return false;
  }
}

export async function runCliCapture(args, options = {}) {
  let stdout = "";
  let stderr = "";

  const exitCode = await runCli(args, {
    cwd: options.cwd ?? HUB_DIR,
    stdout: {
      write(chunk) {
        stdout += chunk;
      },
    },
    stderr: {
      write(chunk) {
        stderr += chunk;
      },
    },
  });

  return { exitCode, stdout, stderr };
}
