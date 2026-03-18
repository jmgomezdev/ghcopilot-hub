# ArchUnitTS Notes

This reference summarizes the ArchUnitTS API used in this repo. Use it as a quick reminder when writing architecture tests.

## Core API

- `projectFiles()` creates file-based rules.
- `metrics()` creates metrics-based rules (optional for architecture checks).
- `projectSlices()` creates slice-based rules (use only when needed).

## Common Rule Building Blocks

- `inFolder('src/**')` targets folders (path without filename).
- `inPath('src/**/file.ts')` targets full paths.
- `withName('*.ts')` targets filenames.
- `matchFilename('*.spec.ts')` enforces naming rules with glob patterns.
- `matchPattern('*.ts')` enforces filename patterns for a folder.
- `should()` and `shouldNot()` configure expectations.
- `dependOnFiles()` starts a dependency rule.
- `haveNoCycles()` detects circular dependencies.

## Vitest Expectations

- Use `await expect(rule).toPassAsync()` for clear errors.
- `globals: true` is required in `vitest.config.ts` (already enabled in this repo).
- Prefer grouping rules with `describe()` and `it()` from Vitest.

## Pattern Guidance

- Prefer glob strings over regex for folder and path matching.
- Strings are case sensitive; use regex with `i` only when necessary.
- `inFolder()` matches folder paths without filenames, so prefer `**/folder/**` for deep matches.

## Example Rule Categories

- Dependency rules: forbid imports across layers.
- Naming rules: enforce `*.repository.ts`, `*.queries.ts`, or `*.page.tsx` patterns.
- Metrics rules: apply `metrics().lcom().lcom96b().shouldBeBelow(...)` per layer.

## Options

Both `toPassAsync()` and `check()` accept options:

- `logging.enabled` and `logging.level` to debug rule evaluation.
- `allowEmptyTests` should remain `false` to catch typos in patterns.
- `clearCache` if you need to re-scan after dynamic changes.
