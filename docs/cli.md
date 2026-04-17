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
ghcopilot-hub init --pack mpa-base --skill ghcopilot-hub-mermaid-expert
```

When `init` runs without `--pack`, it bootstraps an agents-first project: every hub agent is copied, and the only
synced skill is the default `ghcopilot-hub-consumer` skill unless you also pass one or more `--skill` options.

When `init` runs in an interactive terminal without `--pack` or `--skill`, the CLI starts an interactive assistant so
you can choose between:

- one pack with optional extra skills as the default path
- only agents
- individually selected skills without a pack

In a real terminal session, that assistant uses a TUI with list selection, multi-select, and confirmation prompts. The
pack path stays as the default option, and the extra-skill picker excludes any skills that already come from the chosen
pack. In that TUI multi-select, `Space` toggles a skill and `Enter` confirms the current selection, so pressing
`Enter` immediately will submit without adding anything. When the CLI is running through wrapped or non-compatible
streams, it falls back to the text prompts used by the test suite.

Before applying any sync, the assistant shows a final confirmation summary with the selected mode, pack, extra skills,
default consumer skill behavior, and whether a root `AGENTS.md` bootstrap will be created. In the TUI path that summary
is grouped into a more readable review block before the final confirm prompt.

When `init` runs with a pack, it also bootstraps a root `AGENTS.md` from the bootstrap file declared in that pack's
`bootstrap` field and resolved under `hub/bootstrap/`. A project can select at most one pack, and that target path is persisted in
`settings.bootstrapAgentsTarget` inside the manifest.

If the consumer repository already has `AGENTS.md`, the CLI asks whether it should overwrite that file:

- `yes`: keep `AGENTS.md` as the managed bootstrap target
- `no`: create `AGENTS-base.md` and persist that target instead

In a real terminal session, this overwrite decision also uses the same TUI confirm prompt.

If the command is running without an interactive terminal, or with `--json`, the CLI fails instead of choosing a
target automatically.

### `update`

Recomputes the desired state from the manifest and syncs the project against the current hub state.

```bash
ghcopilot-hub update
ghcopilot-hub update --force
```

If the manifest still references individually selected skills that no longer exist in the current hub catalog,
`update` treats those ids as stale: it rewrites the manifest without them and removes their managed files during sync.

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
ghcopilot-hub add pack ssr-nextjs
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

`diff` uses the same stale-skill sanitation for individually selected skills, so it reports removals instead of failing
with an unknown-skill error.

### `doctor`

Audits the state of the consumer project.

Checks:

- valid manifest
- existing packs and skills
- stale individually selected skills or exclusions that no longer exist in the current hub catalog
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

For stale individually selected skills, `doctor` reports them as issues but does not rewrite the manifest. Use
`update` to apply the cleanup.

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
