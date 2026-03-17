---
name: ghcopilot-hub-consumer
description: >
  Workflow for repositories managed by ghcopilot-hub. Trigger: Use when the repository contains
  `.github/ghcopilot-hub.json`, managed files under `.github/agents/` or `.github/skills/`, or when the user asks
  to run ghcopilot-hub commands, add/remove packs or skills, inspect drift, update managed files, or customize a
  consumer repository safely.
license: Apache-2.0
metadata:
  author: jmgomezdev
  version: "1.0"
---

## When to Use

Use this skill when:

- The repository has `.github/ghcopilot-hub.json`
- The user wants to add or remove packs or skills managed by ghcopilot-hub
- The user wants to inspect drift, preview updates, or resync managed files
- The user needs project-specific customization without breaking managed files

## Critical Patterns

### Managed Files Are Read-Only

Do not edit managed files directly.

Managed paths:

- `.github/agents/**`
- `.github/skills/**`

If the requested change affects managed content, change the manifest or the hub source, then run the CLI.

Legacy files from older `hub/base/` versions may still exist in some repositories; `ghcopilot-hub update` removes
them.

### Local Customization Goes to Overrides

Repository-specific conventions belong in `.github/local-overrides/`.

Use that folder for local preferences, additive instructions, and repository-specific context that should survive
hub updates.

### Preferred Workflow

When acting inside a managed consumer repository:

1. Read `.github/ghcopilot-hub.json`.
2. Decide whether the request needs `init`, `add`, `remove`, `diff`, `doctor`, or `update`.
3. Preview or audit first with `ghcopilot-hub doctor` and `ghcopilot-hub diff` when drift or unexpected changes may
   exist.
4. Apply `ghcopilot-hub update` only after confirming the intended change.
5. If local customization is needed, write to `.github/local-overrides/` instead of editing managed files.

### Conflict Handling

- If a managed file was edited manually, run `ghcopilot-hub doctor` first.
- Do not force overwrite drift unless the user explicitly approves losing local edits.
- If a skill should stop being installed by default, add it to `excludeSkills`.

## Decision Tree

```text
Need to start management in this repo?         -> ghcopilot-hub init
Need new shared capability?                    -> ghcopilot-hub add pack <id> or add skill <id>
Need to remove managed capability?             -> ghcopilot-hub remove pack <id> or remove skill <id>
Need to inspect drift or missing files?        -> ghcopilot-hub doctor
Need to preview file changes before writing?   -> ghcopilot-hub diff
Need to apply the current hub state?           -> ghcopilot-hub update
Need repo-specific customization only?         -> edit .github/local-overrides/
```

## Code Examples

### Example 1: Consumer Manifest

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

### Example 2: Local Override Note

```md
# Repository Overrides

- Prefer `ghcopilot-hub diff` before `ghcopilot-hub update` on this repository.
- Keep internal naming conventions documented here instead of editing managed instructions.
```

## Commands

```bash
ghcopilot-hub init --pack spa-tanstack          # Start managing a repository
ghcopilot-hub add skill mermaid-expert          # Add one managed skill
ghcopilot-hub remove skill tanstack-router      # Remove one managed skill and exclude it
ghcopilot-hub doctor                            # Audit manifest, drift, and missing files
ghcopilot-hub diff                              # Preview managed file changes
ghcopilot-hub update                            # Apply the current hub state
```

## Resources

- **Documentation**: See [references/workflow.md](references/workflow.md) for the full consumer workflow and safety
  rules
