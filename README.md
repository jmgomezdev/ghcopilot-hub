# ghcopilot-hub

[English](README.md) | [Español](docs/es/README.es.md)

Centralized hub for reusing GitHub Copilot agents and skills across projects and materializing them into each
repository with a declarative CLI.

## Why Consumer Projects Use It

Use this project when you want shared Copilot setup to behave like infrastructure instead of copy-pasted files.

With `ghcopilot-hub`, a consumer repository can declare the agents and skills it needs, materialize them from a
central hub, and keep that setup consistent over time.

Typical consumer outcomes:

- Start a new repository with a predefined pack such as `spa-tanstack` or `node-api`
- Add or remove skills over time without manually copying files across repositories
- Inspect the available packs and skills before choosing the setup
- Review drift before updating managed files
- Keep project-specific files outside managed paths

The consumer project declares its desired state in `.github/ghcopilot-hub.json`, and the CLI syncs that state into
`.github/agents/` and `.github/skills/`.

## Quick Start From a Consumer Project

You do not need to install the package globally. The normal flow is to run it with `npx`, and the same commands also
work with `bunx` or another package runner.

Inspect the catalog:

```bash
npx ghcopilot-hub@latest list
npx ghcopilot-hub@latest list packs
npx ghcopilot-hub@latest list skills
```

Initialize a consumer project with a pack:

```bash
npx ghcopilot-hub@latest init --pack spa-tanstack
```

Adjust the selection later:

```bash
npx ghcopilot-hub@latest add skill mermaid-expert
npx ghcopilot-hub@latest remove skill tanstack-router
```

Review or apply the current hub state:

```bash
npx ghcopilot-hub@latest diff
npx ghcopilot-hub@latest doctor
npx ghcopilot-hub@latest update
```

Help is available directly from the terminal:

```bash
npx ghcopilot-hub@latest --help
```

If you prefer, you can also install the package and run `ghcopilot-hub` directly instead of using `npx`.

## Agent System

Every consumer project receives the full hub agent catalog under `.github/agents/`, but the easiest way to use it is
to treat it as a two-step workflow.

Use it like this:

1. Run `/planificador` to turn the request into an approved execution plan.
   It coordinates discovery and design with agents sShared URL, or session memory, so the implementation phase can resume
   without re-planning.

See the full agent system overview in [docs/agent-system.md](docs/agent-system.md).

## Consumer Project Model

Consumer project layout:

```text
.github/
  ghcopilot-hub.json
  agents/
  skills/
  local-overrides/
```

The manifest file `.github/ghcopilot-hub.json` is the local control file for the consumer project. It is not treated
as a managed synced artifact.

Example manifest:

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

## Internal Project Layout

```text
hub/
  agents/            shared agents
  skills/            shared skills with their assets and references
  packs/             declarative skill compositions
tooling/cli/         materialization, diff, and doctor CLI
docs/                operational documentation
```

Version 1 covers the following:

- dynamic catalog of agents and skills loaded from the filesystem
- declarative skill packs
- per-consumer manifest in `.github/ghcopilot-hub.json`
- synchronization of managed files into the consumer repository
- drift detection and diff preview before applying changes
- preservation of local customizations in `.github/local-overrides/`

It does not include functional versioning per project. Every sync targets the current hub state and records the
available revision in managed file headers.

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

The same scripts can also be run with Bun.

Additional documentation:

- [docs/agent-system.md](docs/agent-system.md)
- [docs/architecture.md](docs/architecture.md)
- [docs/cli.md](docs/cli.md)
- [docs/create-skill.md](docs/create-skill.md)
- [docs/create-pack.md](docs/create-pack.md)
- [docs/publish.md](docs/publish.md)

## License

This project is licensed under the MIT License. See [LICENSE](LICENSE).

Copyright (c) 2026 Jose Manuel Gomez Perez.

Website: [jmgomez.dev](https://jmgomez.dev/)
