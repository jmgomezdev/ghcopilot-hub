# Managed Files Policy

- Managed files come from the central hub and are rewritten by the CLI.
- Local customizations must live under `.github/local-overrides/`.
- Use `ghcopilot-hub doctor` to detect drift and missing files.
- Use `ghcopilot-hub diff` before updates when you need a dry run.
