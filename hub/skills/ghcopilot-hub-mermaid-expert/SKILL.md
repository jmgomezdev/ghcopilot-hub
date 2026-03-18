---
name: ghcopilot-hub-mermaid-expert
description: >
  Expert Mermaid diagram design, validation, debugging, and style calibration for docs and architecture
  communication. Trigger: Use when users ask to create, fix, refactor, validate, or theme Mermaid diagrams
  (flowchart, sequence, class, state, gantt, C4), when they report parser/syntax/render readability issues, or when
  they mention connectors, arrows, mermaid-validate, or CLI verification.
license: Apache-2.0
metadata:
  author: jmgomezdev
  version: "1.0"
---

# Mermaid Expert

This skill helps produce accurate, readable Mermaid diagrams with the right level of detail for technical
communication.

## Activation Gates (MANDATORY)

Before giving prescriptive Mermaid advice, choose one path and load only the required reference.

| User task                                     | Load                                                                                                                                                                                      | Do NOT load                                     |
| --------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------- |
| New flowchart for process or decision logic   | **MANDATORY**: [assets/examples/flowchart.md](assets/examples/flowchart.md)                                                                                                               | `sequence.md`, `c4_model.md` unless requested   |
| API/user interaction timeline                 | **MANDATORY**: [assets/examples/sequence.md](assets/examples/sequence.md)                                                                                                                 | `flowchart.md`, `c4_model.md` unless requested  |
| Architecture using C4 notation                | **MANDATORY**: [assets/examples/c4_model.md](assets/examples/c4_model.md)                                                                                                                 | Other examples unless user asks mixed views     |
| Styling, themes, or visual identity           | **MANDATORY**: [assets/examples/styles_and_looks.md](assets/examples/styles_and_looks.md) + [references/cheatsheet.md](references/cheatsheet.md)                                          | Domain-specific examples not needed for styling |
| Unclear/unknown Mermaid type or parser errors | **MANDATORY**: [references/cheatsheet.md](references/cheatsheet.md) + [assets/examples/technical.md](assets/examples/technical.md) + [references/validation.md](references/validation.md) | Files unrelated to the reported error           |
| Connector or arrow disputes                   | **MANDATORY**: [references/cheatsheet.md](references/cheatsheet.md) + [references/validation.md](references/validation.md)                                                                | Style references until syntax is valid          |

If the required file is not loaded, do not provide concrete syntax-level fixes.

Do NOT load image assets under `assets/examples/img` unless the user explicitly asks about visual references.

## Symptom Router (Fast Path)

| Symptom or request                             | Action                                                                                                                      |
| ---------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| "Parse error", "Syntax error", "Lexical error" | Normalize to a minimal reproducible diagram, run `mermaid-validate`, then validate IDs, reserved keywords, and arrow syntax |
| "Connector is wrong", "arrow fails"            | Reduce to the affected edges only, verify operator family against the diagram type, then re-run `mermaid-validate`          |
| "Diagram looks messy"                          | Reduce node count, enforce one message per edge, and choose orientation (`TD` or `LR`) based on reading flow                |
| "Need architecture diagram"                    | Prefer C4 first if audience is mixed (business + technical)                                                                 |
| "Need sequence for API"                        | Use explicit participants and verb-first messages (`Client->>API: Create order`)                                            |
| "Need custom look"                             | Apply `%%{init: ...}%%` with constrained theme variables, then verify contrast/readability                                  |

## Validation Gate (MANDATORY)

Before claiming a Mermaid diagram is fixed or ready, pass through this gate:

1. Reduce the diagram to the smallest block that still reproduces the issue.
2. Run `mermaid-validate` against the current version or a pinned working release.
3. If validation fails, fix syntax and operators before changing labels or theme.
4. Re-run validation after every connector-family change.
5. Only discuss rendering/look issues after the diagram validates successfully.

Treat validation as a correctness gate, not an optional polish step.

## Freedom Calibration

| Scenario                              | Guidance mode                                          | Constraint level |
| ------------------------------------- | ------------------------------------------------------ | ---------------- |
| Greenfield diagram ideation           | Offer 2 to 3 valid structural options                  | High freedom     |
| Existing diagram refactor for clarity | Preserve semantics, change only structure and labels   | Medium freedom   |
| Parser/syntax repair request          | Apply deterministic triage sequence before redesigning | Low freedom      |

If user asks to "fix" an existing diagram, preserve node meaning and edge intent unless they explicitly request
redesign.

## Parser Error Triage (Low-Freedom Path)

| Error signature               | Likely root cause                                     | First fix                                                                   | Fallback                                                             |
| ----------------------------- | ----------------------------------------------------- | --------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| `Parse error` near node id    | Invalid ID token (spaces, reserved word, punctuation) | Replace with snake_case ID and move display text to brackets                | Quote the ID and keep label separate                                 |
| `Lexical error` near arrow    | Wrong arrow/operator for diagram type                 | Normalize edges to type-safe operators (`-->`, `->>`, `-->>`)               | Start from minimal sample in the selected reference and re-add edges |
| `Unknown diagram type`        | Header typo or unsupported block                      | Normalize first line (`flowchart TD`, `sequenceDiagram`, `stateDiagram-v2`) | Switch to closest supported syntax from `technical.md`               |
| Rendering overlaps/truncation | Density too high or config mismatch                   | Reduce nodes/messages and enforce one relation per line                     | Add explicit `%%{init: {"flowchart": {"useMaxWidth": true}}}%%`      |

Repair order is mandatory: type header -> IDs -> edges -> `mermaid-validate` -> labels -> theme.

## Diagram Mindset

Before writing Mermaid code, ask:

- What decision should the reader make after seeing this diagram?
- What is the minimum structure needed to answer that decision?
- Which audience reads this first: business, frontend, backend, or platform?
- Should this be one diagram, or two diagrams with separate concerns?

## Critical Patterns

- Prefer stable IDs (`order_service`, `payment_gateway`) and readable labels in brackets.
- Use `TD` for hierarchies and causal flows; use `LR` for pipelines and lifecycle progressions.
- Keep edge labels action-oriented (`validates`, `persists`, `publishes`) rather than vague (`does`, `handles`).
- In sequence diagrams, alias long participant names early (`participant API as Checkout API`).
- For C4, separate context/container concerns before component-level detail.

## NEVER Do This

- NEVER mix two different diagram goals in one graph (for example, process steps + deployment topology), because it
  kills readability.
- NEVER leave decision edges unlabeled on diamond nodes, because readers cannot reconstruct logic branches.
- NEVER use unquoted IDs with spaces or reserved words, because Mermaid parsers fail in non-obvious ways.
- NEVER argue from rendered output alone when connectors fail; validate operator syntax first with
  `mermaid-validate`.
- NEVER over-theme before structure is stable, because visual tweaks hide modeling problems.
- NEVER exceed roughly 12 nodes in a single flowchart without subgraphs or split diagrams.

## Debug Workflow

1. Start from a minimal valid skeleton for the selected diagram type.
2. Add nodes/edges incrementally and run `mermaid-validate` after each risky change.
3. If validation fails, inspect IDs, brackets, and arrow operators first.
4. If validation passes but rendering is unreadable, reduce density before changing theme.
5. Only after structure is stable and validated, apply look-and-feel settings.

## Commands

```bash
# Validate a one-line diagram with the documented string mode
npx mermaid-validate validate "flowchart TD; A-->B;" --string

# Validate a file while debugging connector/operator issues
npx mermaid-validate validate test_seq1.mmd

# Validate all Mermaid diagrams inside a markdown document
npx mermaid-validate validate-md README.md

# Environment fallback: if the latest npx release crashes, pin a known working version
npx -y mermaid-validate validate "flowchart TD; A-->B;" --string
```

## Output Contract

When responding with a Mermaid solution, include:

1. One-line intent of the diagram.
2. A single runnable Mermaid code block.
3. One short validation note (what was fixed, what `mermaid-validate` confirmed, or why this structure was chosen).

For fix requests, include a "Changed" list with only syntax/structure edits you applied.

## Resources

| Scenario                         | Primary file                                                               | Optional file                                                              |
| -------------------------------- | -------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| Flowchart/process modeling       | [assets/examples/flowchart.md](assets/examples/flowchart.md)               | [references/cheatsheet.md](references/cheatsheet.md)                       |
| Sequence interactions            | [assets/examples/sequence.md](assets/examples/sequence.md)                 | [references/cheatsheet.md](references/cheatsheet.md)                       |
| C4 architecture                  | [assets/examples/c4_model.md](assets/examples/c4_model.md)                 | [assets/examples/styles_and_looks.md](assets/examples/styles_and_looks.md) |
| Class/state/ER/gantt/git/mindmap | [assets/examples/technical.md](assets/examples/technical.md)               | [references/cheatsheet.md](references/cheatsheet.md)                       |
| Visual customization             | [assets/examples/styles_and_looks.md](assets/examples/styles_and_looks.md) | [references/cheatsheet.md](references/cheatsheet.md)                       |
| Validation and connector checks  | [references/validation.md](references/validation.md)                       | [references/cheatsheet.md](references/cheatsheet.md)                       |
