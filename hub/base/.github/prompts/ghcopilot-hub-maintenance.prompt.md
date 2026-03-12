# ghcopilot-hub Maintenance Prompt

Use this prompt when auditing a repository managed by ghcopilot-hub:

1. Run `ghcopilot-hub doctor` to inspect manifest validity and drift.
2. Run `ghcopilot-hub diff` to preview the exact filesystem changes.
3. If the repository is clean, run `ghcopilot-hub update`.
4. Keep repository-specific instructions in `.github/local-overrides/`.
