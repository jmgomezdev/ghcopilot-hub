# AGENTS

Base workflow for repositories initialized with the api-node pack.

## Stack Focus

- TypeScript-backed API services.
- Validation with Zod and test coverage as part of the default baseline.

## Recommended Workflow

1. Plan contracts, validation, and error handling before handlers are written.
2. Keep transport, domain logic, and validation concerns separated.
3. Add repository-specific runtime conventions locally once they are known.

## Guardrails

- Prefer explicit schemas over ad hoc request parsing.
- Keep API behavior deterministic and easy to test.
