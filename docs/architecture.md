# v1 Architecture

## Principles

- Single source of truth: the actual metadata lives in the frontmatter of `*.agent.md` and `SKILL.md`.
- Declarative desired state: each project declares packs, extra skills, and exclusions in
  `.github/ghcopilot-hub.json`.
- No functional versioning: the project always syncs against the latest hub state.
- Minimal traceability: each managed file records the source, revision, and hash of the synced content.
- Controlled customization: local changes go into `.github/local-overrides/`, not managed files.

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
  "skills": ["typescript", "react", "tanstack-query", "tanstack-router", "testing"]
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
    "onConflict": "fail",
    "preserveLocalOverrides": true
  }
}
```

Contract:

- `packs`: list of packs to expand
- `skills`: extra skills outside packs
- `excludeSkills`: skills to remove even if they come from a pack
- `settings.onConflict`: `fail` or `overwrite`
- `settings.preserveLocalOverrides`: keeps `.github/local-overrides/` as unmanaged project space

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
<!-- source: hub/skills/testing/SKILL.md -->
<!-- revision: unknown -->
<!-- content-hash: <sha256> -->
```

JSONC files use `//` comments.

Current CLI versions no longer materialize files from `hub/base/`. If a project still has legacy files from earlier
versions, `ghcopilot-hub update` removes them.

Possible file states:

- `create`: missing from the project
- `update`: exists and can be updated without conflict
- `remove`: is managed and no longer part of the desired state
- `conflict`: has local drift or unmanaged content inside a managed path

## Drift and Conflicts

Drift is detected when the current file body does not match the `content-hash` stored during the last sync.

Policy:

- `onConflict: fail`: blocks `update` and `remove` when drift exists
- `onConflict: overwrite` or `--force`: overwrites or removes even when drift exists

If a run finds conflicts on some managed paths but also has safe operations on others, the CLI still applies those safe
operations and returns exit code `2` so the remaining conflicts stay visible.

## Local Overrides

`.github/local-overrides/` is outside the sync scope. The base instructions file points to this directory so local
context can complement the managed content without editing it directly.
