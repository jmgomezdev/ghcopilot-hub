import assert from "node:assert/strict";
import test from "node:test";

import { renderManagedFile, parseManagedFile, hashContent } from "../src/lib/managed-header.js";
import { resolveProjectState } from "../src/lib/resolver.js";

test("resolveProjectState expande packs, extras y exclusiones sin duplicados", () => {
  const catalog = {
    agents: [{ id: "planner" }],
    skills: [
      { id: "ghcopilot-hub-consumer" },
      { id: "ghcopilot-hub-typescript" },
      { id: "ghcopilot-hub-react" },
      { id: "ghcopilot-hub-testing" },
      { id: "ghcopilot-hub-mermaid-expert" },
    ],
    packs: [
      {
        name: "base-web",
        skills: ["ghcopilot-hub-typescript", "ghcopilot-hub-testing"],
        bootstrapFile: {
          id: "base-web-agents-base",
          sourcePath: "hub/bootstrap/base-web.agents.md",
          sourceRelativePath: "hub/bootstrap/base-web.agents.md",
          targetRelativePath: "AGENTS.md",
        },
      },
    ],
  };

  const state = resolveProjectState({
    catalog,
    manifest: {
      packs: ["base-web"],
      skills: ["mermaid-expert"],
      excludeSkills: ["testing"],
      settings: { onConflict: "fail", bootstrapAgentsTarget: null },
    },
  });

  assert.deepEqual(
    state.agents.map((agent) => agent.id),
    ["planner"]
  );
  assert.deepEqual(
    state.skills.map((skill) => skill.id),
    ["ghcopilot-hub-consumer", "ghcopilot-hub-mermaid-expert", "ghcopilot-hub-typescript"]
  );
});

test("resolveProjectState permite excluir la skill por defecto", () => {
  const catalog = {
    agents: [{ id: "planner" }],
    skills: [{ id: "ghcopilot-hub-consumer" }, { id: "ghcopilot-hub-typescript" }],
    packs: [
      {
        name: "base-web",
        skills: ["ghcopilot-hub-typescript"],
        bootstrapFile: {
          id: "base-web-agents-base",
          sourcePath: "hub/bootstrap/base-web.agents.md",
          sourceRelativePath: "hub/bootstrap/base-web.agents.md",
          targetRelativePath: "AGENTS.md",
        },
      },
    ],
  };

  const state = resolveProjectState({
    catalog,
    manifest: {
      packs: ["base-web"],
      skills: [],
      excludeSkills: ["ghcopilot-hub-consumer"],
      settings: { onConflict: "fail", bootstrapAgentsTarget: null },
    },
  });

  assert.deepEqual(
    state.skills.map((skill) => skill.id),
    ["ghcopilot-hub-typescript"]
  );
  assert.deepEqual(state.bootstrapFiles, []);
});

test("resolveProjectState conserva skills de terceros por su id exacto", () => {
  const catalog = {
    agents: [{ id: "planner" }],
    skills: [{ id: "ghcopilot-hub-consumer" }, { id: "react-best-practices" }],
    packs: [],
  };

  const state = resolveProjectState({
    catalog,
    manifest: {
      packs: [],
      skills: ["react-best-practices"],
      excludeSkills: [],
      settings: { onConflict: "fail", bootstrapAgentsTarget: null },
    },
  });

  assert.deepEqual(
    state.skills.map((skill) => skill.id),
    ["ghcopilot-hub-consumer", "react-best-practices"]
  );
});

test("resolveProjectState incluye bootstrap AGENTS cuando el manifiesto lo fija", () => {
  const catalog = {
    agents: [{ id: "planner" }],
    skills: [{ id: "ghcopilot-hub-consumer" }],
    packs: [
      {
        name: "base-web",
        skills: [],
        bootstrapFile: {
          id: "base-web-agents-base",
          sourcePath: "hub/bootstrap/base-web.agents.md",
          sourceRelativePath: "hub/bootstrap/base-web.agents.md",
          targetRelativePath: "AGENTS.md",
        },
      },
    ],
  };

  const state = resolveProjectState({
    catalog,
    manifest: {
      packs: ["base-web"],
      skills: [],
      excludeSkills: [],
      settings: {
        onConflict: "fail",
        bootstrapAgentsTarget: "AGENTS-base.md",
      },
    },
    includeBootstrapAgents: true,
  });

  assert.deepEqual(state.bootstrapFiles, [
    {
      id: "base-web-agents-base",
      sourcePath: "hub/bootstrap/base-web.agents.md",
      sourceRelativePath: "hub/bootstrap/base-web.agents.md",
      targetRelativePath: "AGENTS-base.md",
    },
  ]);
});

test("managed header preserva el cuerpo y expone el hash de contenido", () => {
  const body = "# Example\n";
  const rendered = renderManagedFile({
    targetRelativePath: ".github/copilot-instructions.md",
    sourceRelativePath: "hub/skills/ghcopilot-hub-testing/SKILL.md",
    revision: "abc123",
    body,
  });

  const parsed = parseManagedFile({
    targetRelativePath: ".github/copilot-instructions.md",
    content: rendered,
  });

  assert.ok(parsed);
  assert.equal(parsed.header["managed-by"], "ghcopilot-hub");
  assert.equal(parsed.header.source, "hub/skills/ghcopilot-hub-testing/SKILL.md");
  assert.equal(parsed.header.revision, "abc123");
  assert.equal(parsed.header["content-hash"], hashContent(body));
  assert.equal(parsed.body, body);
});
