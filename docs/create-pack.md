# Create a Pack

Packs are declarative skill compositions. They contain no logic, only selection.

## Format

File in `hub/packs/<pack-id>.json`:

```json
{
  "name": "node-api",
  "bootstrap": "node-api.agents.md",
  "skills": ["ghcopilot-hub-typescript", "ghcopilot-hub-testing", "ghcopilot-hub-zod"]
}
```

Rules:

- `name` must be unique
- `bootstrap` must point to an existing file under `hub/bootstrap/`
- every listed skill must exist under `hub/skills/`
- hub-authored skills should use the `ghcopilot-hub-` prefix; curated third-party skills may keep their upstream id
- the filename may match `name` to make navigation easier
- keep packs small and composable

## Steps

1. Create the JSON file in `hub/packs/`.
2. Reference only existing skills.
3. Run `npm run validate:hub`.
4. If relevant, document the pack use case in the README.
