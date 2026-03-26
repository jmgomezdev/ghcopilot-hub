import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import test from "node:test";

import { renderManagedFile } from "../src/lib/managed-header.js";

import {
  createMockStdin,
  createTempProject,
  fileExists,
  HUB_DIR,
  readProjectFile,
  runCliCapture,
} from "./test-helpers.js";

test("init materializa agentes y skills del pack", async () => {
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
  assert.equal(await fileExists(projectDir, "AGENTS.md"), true);
  assert.equal(await fileExists(projectDir, ".github/ghcopilot-hub.json"), true);
  assert.equal(await fileExists(projectDir, ".github/agents/planner.agent.md"), true);
  assert.equal(
    await fileExists(projectDir, ".github/skills/ghcopilot-hub-consumer/SKILL.md"),
    true
  );
  assert.equal(await fileExists(projectDir, ".github/skills/ghcopilot-hub-react/SKILL.md"), true);
  assert.equal(
    await fileExists(projectDir, ".github/prompts/ghcopilot-hub-maintenance.prompt.md"),
    false
  );
  assert.equal(
    await fileExists(projectDir, ".github/instructions/ghcopilot-hub.instructions.md"),
    false
  );
  assert.equal(await fileExists(projectDir, ".github/copilot-instructions.md"), false);
  assert.equal(await fileExists(projectDir, ".vscode/settings.json"), false);

  const manifest = JSON.parse(await readProjectFile(projectDir, ".github/ghcopilot-hub.json"));
  assert.deepEqual(manifest.packs, ["spa-tanstack"]);
  assert.deepEqual(manifest.settings, {
    onConflict: "fail",
    bootstrapAgentsTarget: "AGENTS.md",
  });
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
  assert.match(result.stdout, /\.github\/skills\/ghcopilot-hub-mermaid-expert\/SKILL\.md/);
});

test("list muestra packs y skills disponibles del hub", async () => {
  const result = await runCliCapture(["list", "--hub-dir", HUB_DIR]);

  assert.equal(result.exitCode, 0, result.stderr);
  assert.match(result.stdout, /Packs:/);
  assert.match(result.stdout, /- spa-tanstack \(/);
  assert.match(result.stdout, /Skills:/);
  assert.match(result.stdout, /- ghcopilot-hub-mermaid-expert/);
});

test("list packs --json devuelve el catálogo filtrado", async () => {
  const result = await runCliCapture(["list", "packs", "--hub-dir", HUB_DIR, "--json"]);

  assert.equal(result.exitCode, 0, result.stderr);

  const payload = JSON.parse(result.stdout);
  assert.equal(Array.isArray(payload.packs), true);
  assert.equal(
    payload.packs.some((pack) => pack.name === "spa-tanstack"),
    true
  );
  assert.equal("skills" in payload, false);
});

test("init falla si se intentan seleccionar varios packs", async () => {
  const projectDir = await createTempProject();

  const result = await runCliCapture([
    "init",
    "--pack",
    "base-web",
    "--pack",
    "spa-tanstack",
    "--project-dir",
    projectDir,
    "--hub-dir",
    HUB_DIR,
  ]);

  assert.equal(result.exitCode, 1);
  assert.match(result.stderr, /supports only one pack per project/);
});

test("--help muestra la ayuda por stdout y termina con exit code 0", async () => {
  const result = await runCliCapture(["--help"]);

  assert.equal(result.exitCode, 0, result.stderr);
  assert.match(result.stdout, /^Usage:/);
  assert.match(result.stdout, /ghcopilot-hub --help/);
  assert.equal(result.stderr, "");
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
  assert.deepEqual(manifest.excludeSkills, ["ghcopilot-hub-tanstack-router"]);
  assert.equal(
    await fileExists(projectDir, ".github/skills/ghcopilot-hub-tanstack-router/SKILL.md"),
    false
  );
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

  const managedFilePath = path.join(
    projectDir,
    ".github",
    "skills",
    "ghcopilot-hub-consumer",
    "SKILL.md"
  );
  await fs.appendFile(managedFilePath, "\nLOCAL CHANGE\n", "utf8");

  const result = await runCliCapture(["doctor", "--project-dir", projectDir, "--hub-dir", HUB_DIR]);
  assert.equal(result.exitCode, 2);
  assert.match(result.stdout, /Drifted managed files:/);
  assert.match(result.stdout, /\.github\/skills\/ghcopilot-hub-consumer\/SKILL\.md/);
});

test("init sin pack sincroniza agentes y solo la skill por defecto", async () => {
  const projectDir = await createTempProject();

  const result = await runCliCapture(["init", "--project-dir", projectDir, "--hub-dir", HUB_DIR]);

  assert.equal(result.exitCode, 0, result.stderr);
  assert.equal(await fileExists(projectDir, "AGENTS.md"), false);
  assert.equal(await fileExists(projectDir, ".github/agents/planner.agent.md"), true);
  assert.equal(
    await fileExists(projectDir, ".github/skills/ghcopilot-hub-consumer/SKILL.md"),
    true
  );
  assert.equal(await fileExists(projectDir, ".github/skills/ghcopilot-hub-react/SKILL.md"), false);

  const manifest = JSON.parse(await readProjectFile(projectDir, ".github/ghcopilot-hub.json"));
  assert.deepEqual(manifest.packs, []);
  assert.deepEqual(manifest.skills, []);
  assert.deepEqual(manifest.settings, {
    onConflict: "fail",
    bootstrapAgentsTarget: null,
  });
});

test("init con AGENTS existente y rechazo crea AGENTS-base", async () => {
  const projectDir = await createTempProject();
  await fs.writeFile(path.join(projectDir, "AGENTS.md"), "# Local\n", "utf8");

  const result = await runCliCapture(
    ["init", "--pack", "base-web", "--project-dir", projectDir, "--hub-dir", HUB_DIR],
    {
      stdin: createMockStdin(["n"]),
    }
  );

  assert.equal(result.exitCode, 0, result.stderr);
  assert.equal(await readProjectFile(projectDir, "AGENTS.md"), "# Local\n");
  assert.equal(await fileExists(projectDir, "AGENTS-base.md"), true);

  const manifest = JSON.parse(await readProjectFile(projectDir, ".github/ghcopilot-hub.json"));
  assert.deepEqual(manifest.settings, {
    onConflict: "fail",
    bootstrapAgentsTarget: "AGENTS-base.md",
  });
});

test("init con AGENTS existente y confirmacion sobrescribe AGENTS", async () => {
  const projectDir = await createTempProject();
  await fs.writeFile(path.join(projectDir, "AGENTS.md"), "# Local\n", "utf8");

  const result = await runCliCapture(
    ["init", "--pack", "base-web", "--project-dir", projectDir, "--hub-dir", HUB_DIR],
    {
      stdin: createMockStdin(["y"]),
    }
  );

  assert.equal(result.exitCode, 0, result.stderr);
  const content = await readProjectFile(projectDir, "AGENTS.md");
  assert.match(content, /managed-by: ghcopilot-hub/);
  assert.match(content, /Base workflow for repositories initialized with the base-web pack/);
  assert.equal(await fileExists(projectDir, "AGENTS-base.md"), false);

  const manifest = JSON.parse(await readProjectFile(projectDir, ".github/ghcopilot-hub.json"));
  assert.deepEqual(manifest.settings, {
    onConflict: "fail",
    bootstrapAgentsTarget: "AGENTS.md",
  });
});

test("init falla en modo no interactivo si AGENTS ya existe", async () => {
  const projectDir = await createTempProject();
  await fs.writeFile(path.join(projectDir, "AGENTS.md"), "# Local\n", "utf8");

  const result = await runCliCapture([
    "init",
    "--pack",
    "base-web",
    "--project-dir",
    projectDir,
    "--hub-dir",
    HUB_DIR,
  ]);

  assert.equal(result.exitCode, 1);
  assert.match(
    result.stderr,
    /Cannot decide how to handle AGENTS\.md during init in non-interactive mode/
  );
  assert.equal(await fileExists(projectDir, "AGENTS-base.md"), false);
});

test("update con AGENTS desviado crea AGENTS-base cuando el usuario rechaza sobrescribir", async () => {
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

  await fs.writeFile(path.join(projectDir, "AGENTS.md"), "# Local drift\n", "utf8");

  const result = await runCliCapture(
    ["update", "--project-dir", projectDir, "--hub-dir", HUB_DIR],
    {
      stdin: createMockStdin(["n"]),
    }
  );

  assert.equal(result.exitCode, 0, result.stderr);
  assert.equal(await readProjectFile(projectDir, "AGENTS.md"), "# Local drift\n");
  assert.equal(await fileExists(projectDir, "AGENTS-base.md"), true);

  const manifest = JSON.parse(await readProjectFile(projectDir, ".github/ghcopilot-hub.json"));
  assert.equal(manifest.settings.bootstrapAgentsTarget, "AGENTS-base.md");
});

test("add pack falla si el proyecto ya tiene otro pack", async () => {
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

  const result = await runCliCapture([
    "add",
    "pack",
    "node-api",
    "--project-dir",
    projectDir,
    "--hub-dir",
    HUB_DIR,
  ]);

  assert.equal(result.exitCode, 1);
  assert.match(result.stderr, /Project already uses pack "base-web"/);
});

test("update elimina archivos legacy previamente gestionados", async () => {
  const projectDir = await createTempProject();

  await runCliCapture(["init", "--project-dir", projectDir, "--hub-dir", HUB_DIR]);

  const legacyInstruction = renderManagedFile({
    targetRelativePath: ".github/copilot-instructions.md",
    sourceRelativePath: "legacy/.github/copilot-instructions.md",
    revision: "legacy",
    body: "# Legacy\n",
  });
  const legacyPrompt = renderManagedFile({
    targetRelativePath: ".github/prompts/ghcopilot-hub-maintenance.prompt.md",
    sourceRelativePath: "legacy/.github/prompts/ghcopilot-hub-maintenance.prompt.md",
    revision: "legacy",
    body: "# Legacy prompt\n",
  });
  const legacySettings = renderManagedFile({
    targetRelativePath: ".vscode/settings.json",
    sourceRelativePath: "legacy/.vscode/settings.json",
    revision: "legacy",
    body: '{\n  "legacy": true\n}\n',
  });

  await fs.mkdir(path.join(projectDir, ".github", "prompts"), { recursive: true });
  await fs.mkdir(path.join(projectDir, ".vscode"), { recursive: true });
  await fs.writeFile(
    path.join(projectDir, ".github", "copilot-instructions.md"),
    legacyInstruction,
    "utf8"
  );
  await fs.writeFile(
    path.join(projectDir, ".github", "prompts", "ghcopilot-hub-maintenance.prompt.md"),
    legacyPrompt,
    "utf8"
  );
  await fs.writeFile(path.join(projectDir, ".vscode", "settings.json"), legacySettings, "utf8");

  const result = await runCliCapture(["update", "--project-dir", projectDir, "--hub-dir", HUB_DIR]);

  assert.equal(result.exitCode, 0, result.stderr);
  assert.equal(await fileExists(projectDir, ".github/copilot-instructions.md"), false);
  assert.equal(
    await fileExists(projectDir, ".github/prompts/ghcopilot-hub-maintenance.prompt.md"),
    false
  );
  assert.equal(await fileExists(projectDir, ".vscode/settings.json"), false);
});
