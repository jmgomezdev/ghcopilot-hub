# v1 Architecture

## Principles

- Single source of truth: the actual metadata lives in the frontmatter of `*.agent.md` and `SKILL.md`.
- Declarative desired state: each project declares packs, extra skills, and exclusions in
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
- The entire skill folder is synced, including `references/` and `assets/`

### Packs

- Location: `hub/packs/*.json`
- Format:

```json
{
  "name": "spa-tanstack",
  "skills": [
    "ghcopilot-hub-typescript",
    "ghcopilot-hub-react",
    "ghcopilot-hub-tanstack-query",
    "ghcopilot-hub-tanstack-router",
    "ghcopilot-hub-testing"
  ]
}
```

`name` must be unique, and every referenced skill must exist under `hub/skills/`.

## Project Manifest

File: `.github/ghcopilot-hub.json`

```json
{
  "packs": [],
  "skills": [],
  "excludeSkills": [],
  "settings": {
    "onConflict": "fail"
  }
}
```

Contract:

- `packs`: list of packs to expand
- `skills`: extra skills outside packs
- `excludeSkills`: skills to remove even if they come from a pack
- `settings.onConflict`: `fail` or `overwrite`
- hub-managed skill ids must use the `ghcopilot-hub-` prefix

Default skill:

- `ghcopilot-hub-consumer` is always installed unless the project explicitly excludes it in `excludeSkills`

## Resolution

Formula:

```text
agents = all hub agents
skills = defaultSkills + packs + skills - excludeSkills
```

The internal hub layout groups these resources under `hub/`.

Resolution errors:

- missing pack
- missing skill
- invalid or missing frontmatter
- pack with invalid JSON or broken references

## Sync

Source-to-target mapping:

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

- managed: `.github/agents/**`
- managed: `.github/skills/**`
- local: `.github/ghcopilot-hub.json`

The CLI only scans managed paths for diff, doctor, update, and removal decisions.

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
