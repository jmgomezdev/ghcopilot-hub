# CLI

The package binary is `ghcopilot-hub`, and it can also be run with `node tooling/cli/src/bin.js` inside the hub.

## Installation

Global:

```bash
npm install -g ghcopilot-hub
ghcopilot-hub doctor --hub-only
```

Global with Bun:

```bash
bun add -g ghcopilot-hub
ghcopilot-hub doctor --hub-only
```

Without global installation:

```bash
npx ghcopilot-hub@latest doctor --hub-only
```

Without global installation with Bun:

```bash
bunx ghcopilot-hub@latest doctor --hub-only
```

During hub development:

```bash
node tooling/cli/src/bin.js doctor --hub-only
```

During hub development with Bun:

```bash
bun run validate:hub
bun run test
```

## Commands

### `init`

Initializes `.github/ghcopilot-hub.json`, adds optional packs and skills, and applies a full sync.

```bash
ghcopilot-hub init --pack spa-tanstack
ghcopilot-hub init --pack base-web --skill mermaid-expert
```

### `update`

Recomputes the desired state from the manifest and syncs the project against the current hub state.

```bash
ghcopilot-hub update
ghcopilot-hub update --force
```

### `list`

Shows the catalog available to consumer projects without modifying any files.

```bash
ghcopilot-hub list
ghcopilot-hub list packs
ghcopilot-hub list skills
ghcopilot-hub list skills --json
```

`list packs` prints each pack with the skills it expands to. `list skills` prints each skill id and only includes the
display name when it differs from the id.

### `add`

Adds a pack or skill to the manifest and syncs.

```bash
ghcopilot-hub add pack nextjs-ssr
ghcopilot-hub add skill mermaid-expert
```

### `remove`

Removes a pack or skill from the manifest and syncs.

```bash
ghcopilot-hub remove pack spa-tanstack
ghcopilot-hub remove skill tanstack-router
```

In `remove skill`, the skill is also added to `excludeSkills` so a pack cannot bring it back.

### `diff`

Shows what the sync would create, update, or remove without writing files.

```bash
ghcopilot-hub diff
ghcopilot-hub diff --json
```

### `doctor`

Audits the state of the consumer project.

Checks:

- valid manifest
- existing packs and skills
- missing managed files
- drift in managed files
- managed paths with unmanaged content
- orphaned managed files

```bash
ghcopilot-hub doctor
ghcopilot-hub doctor --json
ghcopilot-hub doctor --hub-only
```

`--hub-only` validates the hub repository itself: frontmatter, packs, catalog, and base.

## Common Options

- `--project-dir <path>`: root of the consumer project
- `--hub-dir <path>`: root of the hub when the CLI is run from elsewhere
- `--force`: overrides `onConflict` to `overwrite` for that run
- `--json`: emits structured output

If there are conflicts only on some managed paths, `init`, `update`, `add`, and `remove` still apply the non-conflicting
changes and exit with code `2` to indicate there are conflicts left to resolve.

## Exit Codes

- `0`: operation succeeded or found no issues
- `1`: usage error, invalid manifest, or execution failure
- `2`: `diff` or `doctor` found conflicts/issues, or a sync was partially blocked by conflicts

## Distribution

Before publishing the package:

```bash
npm run prepublishOnly
```

This validates the hub, runs the test suite, and checks the final tarball contents with `npm pack --dry-run`.

With Bun you can run the equivalent validations like this:

```bash
bun run validate:hub
bun run test
bun pm pack --quiet
```
