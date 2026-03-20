# ghcopilot-hub

[English](README.md) | [Español](docs/es/README.es.md)

Centralized hub for reusing GitHub Copilot agents and skills across projects and materializing them into each
repository with a declarative CLI.

## Why Consumer Projects Use It

Use this project when you want shared Copilot setup to behave like infrastructure instead of copy-pasted files.

With `ghcopilot-hub`, a consumer repository can declare the agents and skills it needs, materialize them from a
central hub, and keep that setup consistent over time.

Typical consumer outcomes:

- Bootstrap a repository with only the shared agent catalog when no predefined pack fits yet
- Start a new repository with a predefined pack such as `spa-tanstack` or `node-api`
- Add or remove skills over time without manually copying files across repositories
- Inspect the available packs and skills before choosing the setup
- Review drift before updating managed files
- Keep project-specific files outside managed paths

The consumer project declares its desired state in `.github/ghcopilot-hub.json`, and the CLI syncs that state into
`.github/agents/` and `.github/skills/`. When `init` starts a pack-based project, it also bootstraps a root `AGENTS.md`
file from the hub.

## Quick Start From a Consumer Project

You do not need to install the package globally. The normal flow is to run it with `npx`, and the same commands also
work with `bunx` or another package runner.

Inspect the catalog:

```bash
npx ghcopilot-hub@latest list
npx ghcopilot-hub@latest list packs
npx ghcopilot-hub@latest list skills
```

Bootstrap a consumer project without a predefined pack:

```bash
npx ghcopilot-hub@latest init
```

That agents-first setup syncs the full hub agent catalog and only installs the default
`ghcopilot-hub-consumer` skill unless you also pass explicit `--skill` options.

Initialize a consumer project with a pack when one fits:

```bash
npx ghcopilot-hub@latest init --pack spa-tanstack
```

Pack-based `init` also bootstraps a root `AGENTS.md`. If the repository already has one, the CLI asks whether it
should overwrite that file. If the answer is no, it writes `AGENTS-base.md` instead. In non-interactive mode, that
decision must be resolved manually because the CLI will fail instead of guessing.

Adjust the selection later:

```bash
npx ghcopilot-hub@latest add skill ghcopilot-hub-mermaid-expert
npx ghcopilot-hub@latest remove skill ghcopilot-hub-tanstack-router
```

To exclude a skill that comes from a pack, remove that skill explicitly. The CLI adds it to
`excludeSkills`, so the pack will not bring it back on the next sync. You can also edit
`.github/ghcopilot-hub.json` manually and then run `update`.

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

1. Run `/planner` to turn the request into an approved execution plan.
   It coordinates discovery and design with agents such as `explorer`, `librarian`, `architect`, and `gatekeeper`.
2. Pass that approved plan to `/builder`.
   It executes the approved handoff and closes the loop with `plan-guardian`, `test-sentinel`, and `archiver` for review,
   testing, and traceability.

That plan can be delivered as chat context, a shared URL, or session memory so the implementation phase can resume
without re-planning.

See the full agent system overview in [docs/agent-system.md](docs/agent-system.md).

## Consumer Project Model

Consumer project layout:

```text
.github/
  ghcopilot-hub.json
  agents/
  skills/
```

The manifest file `.github/ghcopilot-hub.json` is the local control file for the consumer project. It is not treated
as a managed synced artifact.

Minimal manifest for an agents-first project:

```json
{
  "packs": [],
  "skills": [],
  "excludeSkills": [],
  "settings": {
    "onConflict": "fail",
    "bootstrapAgentsTarget": null
  }
}
```

Example manifest with a pack:

```json
{
  "packs": ["spa-tanstack"],
  "skills": ["ghcopilot-hub-mermaid-expert"],
  "excludeSkills": [],
  "settings": {
    "onConflict": "fail",
    "bootstrapAgentsTarget": "AGENTS.md"
  }
}
```

Resolution rules:

- the `ghcopilot-hub-consumer` skill is installed by default in every project managed by the CLI
- shared hub skill ids use the `ghcopilot-hub-` prefix to avoid collisions with repository-owned skills
- all hub agents are always copied
- `packs` is optional, so `init` can be used as an agents-first bootstrap command
- pack-based `init` bootstraps `AGENTS.md` in the repository root and persists the chosen target path in `settings.bootstrapAgentsTarget`
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
