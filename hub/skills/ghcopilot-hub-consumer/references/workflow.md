# ghcopilot-hub Consumer Workflow

## Managed vs Local Files

Managed files are rewritten by the CLI and should not be edited by hand:

- `.github/agents/**`
- `.github/skills/**`

Local files stay under project control:

- `.github/ghcopilot-hub.json`

Older repositories may still have legacy managed files from earlier CLI versions; `ghcopilot-hub update`
removes them.

## Recommended Operating Sequence

For most requests inside a managed repository:

1. Read `.github/ghcopilot-hub.json` to understand desired state.
2. Use `ghcopilot-hub doctor` when drift or missing files are possible.
3. Use `ghcopilot-hub diff` when you need a preview.
4. Use `ghcopilot-hub add ...` or `ghcopilot-hub remove ...` to change manifest intent.
5. Use `ghcopilot-hub update` to materialize the latest hub state.

## Resolution Rules

- All hub agents are always installed.
- `ghcopilot-hub-consumer` is installed by default.
- Shared hub skills use the `ghcopilot-hub-` prefix to avoid collisions with repository-owned skills.
- Final skills are resolved as `defaultSkills + packs + skills - excludeSkills`.
- `excludeSkills` wins over packs and default skills.

## Safe Customization Rules

- Keep repo-specific instructions in repository-owned files outside managed paths.
- If a user wants to change centrally managed content, update the hub source instead of patching the consumer copy.
- Only force overwrite drift if the user explicitly accepts replacing local edits.
