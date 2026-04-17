# v1 Architecture

## Principles

- Single source of truth: the actual metadata lives in the frontmatter of `*.agent.md` and `SKILL.md`.
- Declarative desired state: each project declares optional packs, extra skills, and exclusions in
  `.github/ghcopilot-hub.json`.
- No functional versioning: the project always syncs against the latest hub state.
- Minimal traceability: each managed file records the source, revision, and hash of the synced content.

## Hub Resources

### Agents

- Location: `hub/agents/*.agent.md`
- Identifier: filename without `.agent.md`
- Minimum frontmatter: `name`, `description`
- v1 policy: all hub agents are copied into every consumer project

### Skills

- Location: `hub/skills/<skill-id>/SKILL.md`
- Identifier: folder name
- Minimum frontmatter: `name`, `description`
- Hub-authored shared skills use the `ghcopilot-hub-` prefix; curated third-party skills may keep their upstream id
- The entire skill folder is synced, including `references/` and `assets/`

### Packs

- Location: `hub/packs/*.json`
- Format:

```json
{
  "name": "spa-tanstack",
  "bootstrap": "spa-tanstack.agents.md",
  "skills": [
    "ghcopilot-hub-typescript",
    "ghcopilot-hub-react",
    "ghcopilot-hub-tanstack-query",
    "ghcopilot-hub-tanstack-router",
    "ghcopilot-hub-testing"
  ]
}
```

`name` must be unique, `bootstrap` must point to a file under `hub/bootstrap/`, and every referenced skill must exist
under `hub/skills/`.

## Project Manifest

File: `.github/ghcopilot-hub.json`

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

Contract:

- `packs`: optional list with at most one pack to expand
- `skills`: extra skills outside packs
- `excludeSkills`: skills to remove even if they come from a pack
- `settings.onConflict`: `fail` or `overwrite`
- `settings.bootstrapAgentsTarget`: `null`, `AGENTS.md`, or `AGENTS-base.md`
- hub-authored shared skill ids use the `ghcopilot-hub-` prefix; curated third-party skills keep their folder id

Default skill:

- `ghcopilot-hub-consumer` is always installed unless the project explicitly excludes it in `excludeSkills`
- an empty `packs` array is valid and represents an agents-first project baseline

## Resolution

Formula:

```text
agents = all hub agents
skills = defaultSkills + packs + skills - excludeSkills
bootstrapAgents = settings.bootstrapAgentsTarget ? selectedPack.agents.md : none
```

The internal hub layout groups these resources under `hub/`.

Resolution errors:

- missing pack
- missing skill
- invalid or missing frontmatter
- pack with invalid JSON or broken references

Stale individually selected skills are handled differently from pack errors:

- if a pack references a missing skill, hub validation fails because the catalog is inconsistent
- if a project manifest references an individually selected skill that no longer exists, `diff` and `update` treat it as stale consumer state, plan removal of its managed files, and `update` rewrites the manifest without that id

## Sync

Source-to-target mapping:

- `hub/bootstrap/<pack.bootstrap>` -> `AGENTS.md` or `AGENTS-base.md` depending on `settings.bootstrapAgentsTarget`
- `hub/agents/*.agent.md` -> `.github/agents/*.agent.md`
- `hub/skills/<id>/**` -> `.github/skills/<id>/**`

Traceability header:

```md
<!-- managed-by: ghcopilot-hub -->
<!-- source: hub/skills/ghcopilot-hub-testing/SKILL.md -->
<!-- revision: unknown -->
<!-- content-hash: <sha256> -->
```

JSONC files use `//` comments.

Current CLI versions no longer materialize legacy managed files. If a project still has legacy files from earlier
versions, `ghcopilot-hub update` removes them.

Possible file states:

- `create`: missing from the project
- `update`: exists and can be updated without conflict
- `remove`: is managed and no longer part of the desired state
- `conflict`: has local drift or unmanaged content inside a managed path

Managed paths vs local paths:

- managed when selected by manifest: `AGENTS-base.md`
- managed: `.github/agents/**`
- managed: `.github/skills/**`
- local: `.github/ghcopilot-hub.json`

The root `AGENTS.md` bootstrap file is a special case. It is only introduced by pack-based `init`, comes from the
selected pack's companion AGENTS file, and the chosen target path is persisted in the manifest so later syncs can keep
using the same destination. If a repository already has `AGENTS.md`, the CLI asks before overwriting it and can
redirect the managed bootstrap output to `AGENTS-base.md` instead.

The CLI only scans managed paths for diff, doctor, update, and removal decisions.

For stale individually selected skills, the CLI resolves them out of the desired state before planning sync so the
consumer project can converge instead of blocking on an unknown-skill error.

Legacy files from earlier CLI versions are removed on `ghcopilot-hub update`.

Each managed file includes a traceability header with:

- `managed-by`
- `source`
- `revision`
- `content-hash`

`content-hash` lets the CLI distinguish between files that are outdated because the hub changed and files that drifted
because of manual local edits.

## Drift and Conflicts

Drift is detected when the current file body does not match the `content-hash` stored during the last sync.

Policy:

- `onConflict: fail`: blocks `update` and `remove` when drift exists
- `onConflict: overwrite` or `--force`: overwrites or removes even when drift exists

If a run finds conflicts on some managed paths but also has safe operations on others, the CLI still applies those safe
operations and returns exit code `2` so the remaining conflicts stay visible.
