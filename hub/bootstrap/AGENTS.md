# AGENTS

This repository is managed with ghcopilot-hub.

## Recommended Workflow

1. Use `/planner` to turn a request into a concrete execution plan.
2. Review and approve that plan before implementation starts.
3. Use `/builder` to execute the approved work.

## Operating Rules

- Keep repository-specific conventions in local documentation and manifests.
- Prefer shared hub skills before adding one-off instructions.
- Treat generated or managed files as synchronized outputs unless the repository documents a local override policy.

## Handoff Notes

- Share the approved plan, affected files, and validation commands with the implementation agent.
- Record any repository-specific decisions near the code they affect.
