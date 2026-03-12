import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import test from "node:test";

import {
  createTempProject,
  fileExists,
  HUB_DIR,
  readProjectFile,
  runCliCapture,
} from "./test-helpers.js";

test("init materializa agentes, base y skills del pack", async () => {
  const projectDir = await createTempProject();

  const result = await runCliCapture([
    "init",
    "--pack",
    "spa-tanstack",
    "--project-dir",
    projectDir,
    "--hub-dir",
    HUB_DIR,
  ]);

  assert.equal(result.exitCode, 0, result.stderr);
  assert.equal(await fileExists(projectDir, ".github/ghcopilot-hub.json"), true);
  assert.equal(await fileExists(projectDir, ".github/agents/planificador.agent.md"), true);
  assert.equal(
    await fileExists(projectDir, ".github/skills/ghcopilot-hub-consumer/SKILL.md"),
    true
  );
  assert.equal(await fileExists(projectDir, ".github/skills/react/SKILL.md"), true);
  assert.equal(
    await fileExists(projectDir, ".github/prompts/ghcopilot-hub-maintenance.prompt.md"),
    true
  );
  assert.equal(await fileExists(projectDir, ".vscode/settings.json"), true);

  const manifest = JSON.parse(await readProjectFile(projectDir, ".github/ghcopilot-hub.json"));
  assert.deepEqual(manifest.packs, ["spa-tanstack"]);
});

test("diff anticipa archivos nuevos cuando cambia el manifiesto sin aplicar sync", async () => {
  const projectDir = await createTempProject();

  await runCliCapture([
    "init",
    "--pack",
    "base-web",
    "--project-dir",
    projectDir,
    "--hub-dir",
    HUB_DIR,
  ]);

  const manifestPath = path.join(projectDir, ".github", "ghcopilot-hub.json");
  const manifest = JSON.parse(await fs.readFile(manifestPath, "utf8"));
  manifest.skills.push("mermaid-expert");
  await fs.writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");

  const result = await runCliCapture(["diff", "--project-dir", projectDir, "--hub-dir", HUB_DIR]);

  assert.equal(result.exitCode, 0, result.stderr);
  assert.match(result.stdout, /\.github\/skills\/mermaid-expert\/SKILL\.md/);
});

test("remove skill añade exclusion y elimina archivos huérfanos", async () => {
  const projectDir = await createTempProject();

  await runCliCapture([
    "init",
    "--pack",
    "spa-tanstack",
    "--project-dir",
    projectDir,
    "--hub-dir",
    HUB_DIR,
  ]);

  const result = await runCliCapture([
    "remove",
    "skill",
    "tanstack-router",
    "--project-dir",
    projectDir,
    "--hub-dir",
    HUB_DIR,
  ]);
  assert.equal(result.exitCode, 0, result.stderr);

  const manifest = JSON.parse(await readProjectFile(projectDir, ".github/ghcopilot-hub.json"));
  assert.deepEqual(manifest.excludeSkills, ["tanstack-router"]);
  assert.equal(await fileExists(projectDir, ".github/skills/tanstack-router/SKILL.md"), false);
});

test("doctor detecta drift en un archivo gestionado", async () => {
  const projectDir = await createTempProject();

  await runCliCapture([
    "init",
    "--pack",
    "base-web",
    "--project-dir",
    projectDir,
    "--hub-dir",
    HUB_DIR,
  ]);

  const managedFilePath = path.join(projectDir, ".github", "copilot-instructions.md");
  await fs.appendFile(managedFilePath, "\nLOCAL CHANGE\n", "utf8");

  const result = await runCliCapture(["doctor", "--project-dir", projectDir, "--hub-dir", HUB_DIR]);
  assert.equal(result.exitCode, 2);
  assert.match(result.stdout, /Drifted managed files:/);
  assert.match(result.stdout, /\.github\/copilot-instructions\.md/);
});

test("init sin pack instala la skill por defecto del hub", async () => {
  const projectDir = await createTempProject();

  const result = await runCliCapture(["init", "--project-dir", projectDir, "--hub-dir", HUB_DIR]);

  assert.equal(result.exitCode, 0, result.stderr);
  assert.equal(
    await fileExists(projectDir, ".github/skills/ghcopilot-hub-consumer/SKILL.md"),
    true
  );

  const manifest = JSON.parse(await readProjectFile(projectDir, ".github/ghcopilot-hub.json"));
  assert.deepEqual(manifest.packs, []);
  assert.deepEqual(manifest.skills, []);
});

test("add pack aplica archivos no conflictivos aunque exista settings.json local", async () => {
  const projectDir = await createTempProject();

  await fs.mkdir(path.join(projectDir, ".vscode"), { recursive: true });
  await fs.writeFile(
    path.join(projectDir, ".vscode", "settings.json"),
    '{\n  "editor.tabSize": 2\n}\n',
    "utf8"
  );

  const initResult = await runCliCapture([
    "init",
    "--project-dir",
    projectDir,
    "--hub-dir",
    HUB_DIR,
  ]);

  assert.equal(initResult.exitCode, 2);
  assert.equal(await fileExists(projectDir, ".github/agents/planificador.agent.md"), true);
  assert.equal(
    await fileExists(projectDir, ".github/skills/ghcopilot-hub-consumer/SKILL.md"),
    true
  );
  assert.match(initResult.stdout, /Sync applied with conflicts/);
  assert.match(initResult.stdout, /\.vscode\/settings\.json/);

  const addResult = await runCliCapture([
    "add",
    "pack",
    "base-web",
    "--project-dir",
    projectDir,
    "--hub-dir",
    HUB_DIR,
  ]);

  assert.equal(addResult.exitCode, 2);
  assert.equal(await fileExists(projectDir, ".github/skills/typescript/SKILL.md"), true);
  assert.equal(await fileExists(projectDir, ".github/skills/testing/SKILL.md"), true);
  assert.match(addResult.stdout, /Sync applied with conflicts/);
  assert.match(addResult.stdout, /\.vscode\/settings\.json/);
});
