import assert from "node:assert/strict";
import test from "node:test";

import { renderManagedFile, parseManagedFile, hashContent } from "../src/lib/managed-header.js";
import { resolveProjectState } from "../src/lib/resolver.js";

test("resolveProjectState expande packs, extras y exclusiones sin duplicados", () => {
  const catalog = {
    agents: [{ id: "planificador" }],
    skills: [
      { id: "ghcopilot-hub-consumer" },
      { id: "typescript" },
      { id: "react" },
      { id: "testing" },
      { id: "mermaid-expert" },
    ],
    packs: [
      { name: "base-web", skills: ["typescript", "testing"] },
      { name: "spa", skills: ["typescript", "react"] },
    ],
    baseFiles: [{ targetRelativePath: ".github/copilot-instructions.md" }],
  };

  const state = resolveProjectState({
    catalog,
    manifest: {
      packs: ["base-web", "spa"],
      skills: ["mermaid-expert"],
      excludeSkills: ["testing"],
      settings: { onConflict: "fail", preserveLocalOverrides: true },
    },
  });

  assert.deepEqual(
    state.agents.map((agent) => agent.id),
    ["planificador"]
  );
  assert.deepEqual(
    state.skills.map((skill) => skill.id),
    ["ghcopilot-hub-consumer", "mermaid-expert", "react", "typescript"]
  );
  assert.equal(state.baseFiles.length, 1);
});

test("resolveProjectState permite excluir la skill por defecto", () => {
  const catalog = {
    agents: [{ id: "planificador" }],
    skills: [{ id: "ghcopilot-hub-consumer" }, { id: "typescript" }],
    packs: [{ name: "base-web", skills: ["typescript"] }],
    baseFiles: [],
  };

  const state = resolveProjectState({
    catalog,
    manifest: {
      packs: ["base-web"],
      skills: [],
      excludeSkills: ["ghcopilot-hub-consumer"],
      settings: { onConflict: "fail", preserveLocalOverrides: true },
    },
  });

  assert.deepEqual(
    state.skills.map((skill) => skill.id),
    ["typescript"]
  );
});

test("managed header preserva el cuerpo y expone el hash de contenido", () => {
  const body = "# Example\n";
  const rendered = renderManagedFile({
    targetRelativePath: ".github/copilot-instructions.md",
    sourceRelativePath: "hub/base/.github/copilot-instructions.md",
    revision: "abc123",
    body,
  });

  const parsed = parseManagedFile({
    targetRelativePath: ".github/copilot-instructions.md",
    content: rendered,
  });

  assert.ok(parsed);
  assert.equal(parsed.header["managed-by"], "ghcopilot-hub");
  assert.equal(parsed.header.source, "hub/base/.github/copilot-instructions.md");
  assert.equal(parsed.header.revision, "abc123");
  assert.equal(parsed.header["content-hash"], hashContent(body));
  assert.equal(parsed.body, body);
});
