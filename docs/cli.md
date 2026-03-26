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

Help:

```bash
ghcopilot-hub --help
ghcopilot-hub list --help
```

## Commands

### `init`

Initializes `.github/ghcopilot-hub.json`, syncs all hub agents, optionally adds one pack and extra skills, and applies a full
sync.

```bash
ghcopilot-hub init
ghcopilot-hub init --skill ghcopilot-hub-mermaid-expert
ghcopilot-hub init --pack spa-tanstack
ghcopilot-hub init --pack base-web --skill ghcopilot-hub-mermaid-expert
```

When `init` runs without `--pack`, it bootstraps an agents-first project: every hub agent is copied, and the only
synced skill is the default `ghcopilot-hub-consumer` skill unless you also pass one or more `--skill` options.

When `init` runs with a pack, it also bootstraps a root `AGENTS.md` from that pack's companion file in
`hub/packs/<pack-name>.agents.md`. A project can select at most one pack, and that target path is persisted in
`settings.bootstrapAgentsTarget` inside the manifest.

If the consumer repository already has `AGENTS.md`, the CLI asks whether it should overwrite that file:

- `yes`: keep `AGENTS.md` as the managed bootstrap target
- `no`: create `AGENTS-base.md` and persist that target instead

If the command is running without an interactive terminal, or with `--json`, the CLI fails instead of choosing a
target automatically.

### `update`

Recomputes the desired state from the manifest and syncs the project against the current hub state.

```bash
ghcopilot-hub update
ghcopilot-hub update --force
```

If the manifest already manages bootstrap agents through `settings.bootstrapAgentsTarget`, `update` keeps that
pack-specific bootstrap file in sync too. When the target is `AGENTS.md` and the run would overwrite an existing root
`AGENTS.md`, the CLI asks again before replacing it unless `--force` is used.

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
ghcopilot-hub add skill ghcopilot-hub-mermaid-expert
```

Projects support only one pack. If a project already has a different pack, `add pack` fails until that pack is
removed.

### `remove`

Removes a pack or skill from the manifest and syncs.

```bash
ghcopilot-hub remove pack spa-tanstack
ghcopilot-hub remove skill ghcopilot-hub-tanstack-router
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
- `--help`: prints the CLI help to the terminal

`--json` disables the interactive AGENTS bootstrap prompt. If a pack-based `init` or bootstrap `update` would need
that decision, the command exits with code `1` and an explicit error.

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
