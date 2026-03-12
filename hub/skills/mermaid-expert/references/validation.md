# Mermaid Validation Workflow

Use this reference when the task involves parser errors, connector/operator disputes, or pre-delivery verification.

## When to Load

Load this file when:

- the user reports `Parse error`, `Lexical error`, or `Syntax error`
- the user questions whether a connector/operator is valid
- you are about to claim a Mermaid diagram is fixed
- you need a fast CLI-based correctness check before styling

Do NOT load this file for pure visual theming requests unless syntax is already in doubt.

## Validation Workflow

1. Reduce the diagram to the smallest failing block.
2. Validate with `mermaid-validate`.
3. Fix header, IDs, or operator family based on the error.
4. Re-run validation.
5. Restore surrounding nodes only after the reduced case validates.
6. Render or theme only after the validator passes.

If the latest `npx mermaid-validate` release crashes in the current runtime, pin a known working version before continuing.

## Operator Checks

Use the diagram-type operator family first, then validate.

| Diagram type      | Common operators to verify |
| ----------------- | -------------------------- |
| `flowchart`       | `-->`, `-.->`, `==>`       |
| `sequenceDiagram` | `->>`, `-->>`, `-)`, `--)` |
| `stateDiagram-v2` | `-->`                      |

If a connector looks valid but still fails, suspect one of these before changing labels:

- wrong diagram header for the operator family
- invisible invalid token in an ID or label
- unsupported grouping syntax for the selected Mermaid version
- line breaks merged incorrectly during copy/paste

## Commands

```bash
# Validate a diagram string directly (documented CLI syntax)
npx mermaid-validate validate "flowchart TD; A-->B;" --string

# Validate a local file
npx mermaid-validate validate diagram.mmd

# Validate Mermaid blocks inside markdown documentation
npx mermaid-validate validate-md architecture.md

# Fallback if the latest release crashes in the current Node runtime
npx -y mermaid-validate validate "flowchart TD; A-->B;" --string
```

## Interpretation Rules

- A passing validator means syntax is structurally acceptable, not necessarily readable.
- A failing validator means do not continue with theme or layout discussions yet.
- When debugging connectors, change one operator family at a time and re-run validation.
- Prefer validator-confirmed evidence over visual guesswork.
- If the latest CLI crashes before validating, treat that as a tooling issue and retry with a pinned working version before judging the diagram itself.
