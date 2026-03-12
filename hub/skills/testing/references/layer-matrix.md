# Layer Matrix and Test Ownership

## Goal

Choose the smallest test that validates the right boundary without violating Clean Architecture.

## Boundary-First Decision Table

| Change Type | Primary Layer to Test | Test Type | Allowed Mocks | Primary Confidence Signal |
| --- | --- | --- | --- | --- |
| Business rule or schema update | `src/domain` | Unit | None | Input-output contract and thrown errors |
| Query key factory or app hook orchestration | `src/application` | Unit | Repositories, client state stores | Stable query key, hook outcome, called dependency contract |
| DTO mapping or repository behavior | `src/infrastructure` | Integration | HTTP boundary only (MSW) | Correct endpoint + mapped domain entity shape |
| Loader/search param wiring | `src/interface` | Integration | Application boundary only | URL input transformed to correct query options |
| Component interaction and accessibility | `src/presentation` | Component integration | Application hooks/stores | User-visible behavior through roles/labels |
| Full user journey across routes | E2E scope | Cypress E2E | External dependencies only when unstable | Journey succeeds through real browser flow |

## Layer Ownership Rules

- Domain owns business invariants and schema constraints.
- Application owns orchestration, query identity, and store interaction.
- Infrastructure owns DTO to domain contract and transport behavior.
- Interface owns route adapters, params/search validation, and loader composition.
- Presentation owns rendering, interaction semantics, and accessibility outcomes.
- E2E owns confidence that composed layers work together in production-like runtime.

## Illegal Test Boundaries (Never)

- Interface tests calling repositories directly.
- Presentation tests mocking `fetch`, `axios`, or `useQuery` internals.
- Infrastructure tests mocking mapper behavior being validated.
- E2E asserting internal implementation details (hook calls, query internals).

## Placement Heuristics

| Source File Pattern | Preferred Test Location | Why |
| --- | --- | --- |
| `src/domain/**/{Entity}.schema.ts` | same folder `*.test.ts` | Fast feedback for invariant changes |
| `src/application/**/**.queries.ts` | same folder `*.test.ts` | Query key drift detected early |
| `src/infrastructure/**/**.repository.ts` | same folder `*.test.ts` | Endpoint/mapping contract coverage |
| `src/interface/router/routes/**/*.route.tsx` | same folder `*.test.ts` | Loader and param adapter correctness |
| `src/presentation/**/*.tsx` | same folder `*.test.tsx` | User-facing behavior preserved |
| `cypress/e2e/**/*.cy.ts` | feature-aligned spec file | Journey-level confidence |

## Fast Selection Checklist

1. Identify the first layer where the bug could appear.
2. Test that layer directly before creating cross-layer tests.
3. Add one cross-layer test only if regression risk remains high.
4. Escalate to E2E only for route navigation, auth, payment/cart, or browser integration concerns.

## Typical Misclassification and Fix

| Smell | Why It Is Wrong | Correct Move |
| --- | --- | --- |
| Testing loader logic in component tests | Adapter behavior hidden behind UI noise | Add interface loader integration test |
| Testing mapper shape in domain tests | Domain does not know DTO contracts | Move to infrastructure integration test |
| Asserting store selectors in E2E | E2E should observe user outcomes | Assert visible state and URL, not internals |

## Exit Criteria by Layer

- Domain: all invariant branches covered, no mocks needed.
- Application: key factories and orchestration paths deterministic.
- Infrastructure: transport + mapping contract verified with MSW.
- Interface: loader wiring validated for success and invalid input.
- Presentation: interaction semantics validated via roles/labels.
- E2E: critical journey green with isolated test data.
