import fs from "node:fs/promises";
import path from "node:path";

export function toPosixPath(value) {
  return value.split(path.sep).join("/");
}

export function fromRoot(rootDir, targetPath) {
  return path.join(rootDir, ...targetPath.split("/"));
}

export function relativeFrom(rootDir, targetPath) {
  return toPosixPath(path.relative(rootDir, targetPath));
}

export async function pathExists(targetPath) {
  try {
    await fs.access(targetPath);
    return true;
  } catch {
    return false;
  }
}

export async function ensureDir(targetPath) {
  await fs.mkdir(targetPath, { recursive: true });
}

export async function readTextIfExists(targetPath) {
  if (!(await pathExists(targetPath))) {
    return null;
  }

  return fs.readFile(targetPath, "utf8");
}

export async function walkFiles(rootDir) {
  if (!(await pathExists(rootDir))) {
    return [];
  }

  const results = [];
  const entries = await fs.readdir(rootDir, { withFileTypes: true });

  for (const entry of entries) {
    const absolutePath = path.join(rootDir, entry.name);

    if (entry.isDirectory()) {
      results.push(...(await walkFiles(absolutePath)));
      continue;
    }

    if (entry.isFile()) {
      results.push(absolutePath);
    }
  }

  return results;
}

export async function removeEmptyDirectories(rootDir, stopAtDir) {
  if (!(await pathExists(rootDir))) {
    return;
  }

  if (path.resolve(rootDir) === path.resolve(stopAtDir)) {
    return;
  }

  const entries = await fs.readdir(rootDir);
  if (entries.length > 0) {
    return;
  }

  await fs.rmdir(rootDir);
  await removeEmptyDirectories(path.dirname(rootDir), stopAtDir);
}
