# ghcopilot-hub

[English](README.md) | [Español](docs/es/README.es.md)

Centralized hub for reusing GitHub Copilot agents and skills across projects and materializing them into each
repository with a declarative CLI.

## v1 Goals

Version 1 covers the following:

- dynamic catalog of agents and skills loaded from the filesystem
- declarative skill packs
- per-consumer manifest in `.github/ghcopilot-hub.json`
- synchronization of managed files into the consumer repository
- drift detection and diff preview before applying changes
- preservation of local customizations in `.github/local-overrides/`

It does not include functional versioning per project. Every sync targets the current hub state and records the
available revision in managed file headers.

## Hub Layout

```text
hub/
  agents/            shared agents
  skills/            shared skills with their assets and references
  packs/             declarative skill compositions
tooling/cli/         materialization, diff, and doctor CLI
docs/                operational documentation
```

## Consumer Project Layout

```text
.github/
  ghcopilot-hub.json
  agents/
  skills/
  local-overrides/
```

The manifest file `.github/ghcopilot-hub.json` is the local control file for the consumer project. It is not treated
as a managed synced artifact.

## Manifest

```json
{
  "packs": ["spa-tanstack"],
  "skills": ["mermaid-expert"],
  "excludeSkills": [],
  "settings": {
    "onConflict": "fail",
    "preserveLocalOverrides": true
  }
}
```

Resolution rules:

- the `ghcopilot-hub-consumer` skill is installed by default in every project managed by the CLI
- all hub agents are always copied
- the final skills set is resolved as `packs + skills - excludeSkills`
- `excludeSkills` wins even if a skill comes from a pack
- local files live outside managed paths

## CLI

Quick start:

```bash
npm install
node tooling/cli/src/bin.js doctor --hub-only
```

Quick start with Bun:

```bash
bun install
bun run validate:hub
```

Install as a distributed package:

```bash
npm install -g ghcopilot-hub
ghcopilot-hub doctor --hub-only
```

Global install with Bun:

```bash
bun add -g ghcopilot-hub
ghcopilot-hub doctor --hub-only
```

Ephemeral usage without global install:

```bash
npx ghcopilot-hub@latest doctor --hub-only
```

Ephemeral usage with Bun:

```bash
bunx ghcopilot-hub@latest doctor --hub-only
```

Examples for a consumer project:

```bash
ghcopilot-hub init --pack spa-tanstack
ghcopilot-hub add skill mermaid-expert
ghcopilot-hub remove skill tanstack-router
ghcopilot-hub diff
ghcopilot-hub doctor
ghcopilot-hub update
```

## Sync Rules

Managed paths:

- `.github/agents/**`
- `.github/skills/**`

Local paths:

- `.github/local-overrides/**`
- `.github/ghcopilot-hub.json`

Legacy files that came from older `hub/base/` versions are removed on `ghcopilot-hub update`.

Each managed file includes a traceability header with:

- `managed-by`
- `source`
- `revision`
- `content-hash`

`content-hash` allows the CLI to distinguish between a file that is outdated because the hub changed and a file that
has drifted because of manual local edits.

## Repository Scaffolding

The syncable catalog lives under `hub/`. This keeps the repository root available for tooling, documentation,
workflows, and package metadata.

## Development

```bash
npm run lint
npm run format:check
npm test
npm run validate:hub
npm run pack:check
```

With Bun:

```bash
bun run validate:hub
bun run test
bun pm pack --quiet
```

Additional documentation:

- [docs/architecture.md](docs/architecture.md)
- [docs/cli.md](docs/cli.md)
- [docs/create-skill.md](docs/create-skill.md)
- [docs/create-pack.md](docs/create-pack.md)
- [docs/publish.md](docs/publish.md)

## License

This project is licensed under the MIT License. See [LICENSE](LICENSE).

Copyright (c) 2026 Jose Manuel Gomez Perez.
