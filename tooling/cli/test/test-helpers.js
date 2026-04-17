import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { runCli } from "../src/cli.js";

export const HUB_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");

export async function createTempProject() {
  return fs.mkdtemp(path.join(os.tmpdir(), "ghcopilot-hub-test-"));
}

export async function createTempHub() {
  const hubRoot = await fs.mkdtemp(path.join(os.tmpdir(), "ghcopilot-hub-catalog-"));
  await fs.cp(path.join(HUB_DIR, "hub"), path.join(hubRoot, "hub"), { recursive: true });
  return hubRoot;
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
    stdin: options.stdin ?? createMockStdin([], { isTTY: false }),
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

export function createMockStdin(lines = [], options = {}) {
  const queue = [...lines].map((line) => (line.endsWith("\n") ? line : `${line}\n`));
  const listeners = new Map();

  return {
    isTTY: options.isTTY ?? true,
    once(event, callback) {
      listeners.set(event, callback);
    },
    removeListener(event, callback) {
      if (listeners.get(event) === callback) {
        listeners.delete(event);
      }
    },
    resume() {
      const callback = listeners.get("data");
      if (!callback || queue.length === 0) {
        return;
      }

      listeners.delete("data");
      setImmediate(() => callback(queue.shift()));
    },
    pause() {},
  };
}
