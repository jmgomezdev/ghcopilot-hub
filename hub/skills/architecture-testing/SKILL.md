---
name: architecture-testing
description: >
  Architecture tests with ArchUnitTS for Clean Architecture boundaries and import rules. Trigger: When adding or
  updating architecture tests or enforcing layer dependency rules.
license: Apache-2.0
metadata:
  author: jmgomezdev
  version: "1.0"
---

## When to Use

- When creating or updating architecture tests with ArchUnitTS.
- When enforcing Clean Architecture layer boundaries or import rules.
- When adding new folders or moving layers that impact dependency checks.
- When reviewing architecture violations or refactoring cross-layer imports.

## Critical Patterns

- Use `projectFiles()` and glob-based `inFolder()` or `inPath()` for folder rules; avoid regex unless glob cannot
  express the pattern.
- Keep rules explicit per layer. Do not rely on a single broad allowlist that hides violations.
- Place architecture tests in `src/core/test/architecture/` and use `*.test.ts` filenames.
- Prefer rule-focused files (dependency rules, naming rules, metrics rules) instead of one large spec.
- Domain must not depend on any other layer, including `core`.
- Infrastructure must not depend on `application`, `interface`, or `presentation`.
- Application must not depend on `interface` or `presentation` (infrastructure allowed only as types).
- Interface must not depend on `infrastructure` (loaders should consume application queries only).
- Presentation must not depend on `infrastructure` (DTOs and repositories are forbidden).
- For DTO rules, target `**/*.dto.ts` under `src/infrastructure` and forbid dependencies from `application` and
  `presentation`.
- Use `toPassAsync()` for Vitest. `globals: true` must be enabled in `vitest.config.ts`.
- Keep `allowEmptyTests` off (default). Only enable it with a clear reason.
- When enforcing naming conventions, use `matchFilename()` with a glob pattern.
- When enforcing basic code quality, use `metrics().lcom().lcom96b()` with a clear threshold per layer.

## Code Examples

```ts
import { projectFiles } from "archunit";
import { describe, expect, it } from "vitest";

describe("Architecture Rules", () => {
  it("should be free of cycles in src", async () => {
    const rule = projectFiles().inFolder("src/**").should().haveNoCycles();
    await expect(rule).toPassAsync();
  });

  it("domain must be isolated", async () => {
    const forbidden = [
      "src/application/**",
      "src/infrastructure/**",
      "src/interface/**",
      "src/presentation/**",
      "src/core/**",
    ];

    for (const folder of forbidden) {
      const rule = projectFiles().inFolder("src/domain/**").shouldNot().dependOnFiles().inFolder(folder);

      await expect(rule).toPassAsync();
    }
  });

  it("presentation must not depend on infrastructure or DTOs", async () => {
    const layerRule = projectFiles()
      .inFolder("src/presentation/**")
      .shouldNot()
      .dependOnFiles()
      .inFolder("src/infrastructure/**");

    const dtoRule = projectFiles()
      .inFolder("src/presentation/**")
      .shouldNot()
      .dependOnFiles()
      .inPath("src/infrastructure/**/*.dto.ts");

    await expect(layerRule).toPassAsync();
    await expect(dtoRule).toPassAsync();
  });

  it("repositories should follow naming", async () => {
    const rule = projectFiles().inFolder("src/infrastructure/**").should().matchFilename("*.repository.ts");

    await expect(rule).toPassAsync();
  });
});
```

## Commands

```bash
npm install archunit --save-dev
npm run test
vitest --run src/core/test/architecture/architecture.test.ts
```

## Resources

- See [references/archunitts.md](references/archunitts.md) for ArchUnitTS API notes and pattern guidance.
