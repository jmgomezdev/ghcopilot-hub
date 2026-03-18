---
name: ghcopilot-hub-testing
description: >
  Layer-aware testing strategies for Clean Architecture using Vitest, React Testing Library, MSW, and Cypress. Use
  when creating or reviewing unit, integration, component, architectural, or E2E test plans across `src/domain`,
  `src/application`, `src/infrastructure`, `src/interface`, and `src/presentation`, especially for mocking-boundary
  decisions, async reliability, and flaky-test prevention. Trigger keywords: test, vitest, cypress, e2e, mock, msw,
  renderHook, loader, query, router, zustand.
license: Apache-2.0
metadata:
  author: jmgomezdev
  version: "1.0"
---

## When to Use

- When writing or updating tests across Clean Architecture layers.
- When deciding how to mock dependencies and where to place tests.
- When adding new routes, repositories, mappers, hooks, or UI components.
- When creating test utilities, setup files, or global test configuration.
- When designing or reviewing Cypress user journeys and E2E stability.

## Decision Router (Mandatory Loading)

Use this router before writing any test code.

Loading protocol:

1. Choose exactly one scenario row first.
2. MANDATORY: read the selected reference file completely before drafting tests.
3. Do NOT load additional reference files unless the selected file cannot resolve the decision.
4. If still blocked, load only one extra reference and return to implementation.

| Scenario                                | MANDATORY Reference                                            | Do NOT Load (unless needed) | Why                                                 |
| --------------------------------------- | -------------------------------------------------------------- | --------------------------- | --------------------------------------------------- |
| Pick test type, boundary, and placement | [references/layer-matrix.md](references/layer-matrix.md)       | `zustand-mocking.md`        | Prevents layer leaks and wrong mocking scope        |
| Configure runner, environment, or setup | [references/tooling-map.md](references/tooling-map.md)         | `zustand-mocking.md`        | Avoids over-configuring suites                      |
| Test async UI/state transitions         | [references/async-testing.md](references/async-testing.md)     | `assertions.md`             | Reduces flaky waits and race conditions             |
| Improve assertions or test readability  | [references/assertions.md](references/assertions.md)           | `tooling-map.md`            | Keeps assertions explicit and stable                |
| Fix slow/flaky tests                    | [references/performance.md](references/performance.md)         | `tooling-map.md`            | Prioritizes determinism before tooling tweaks       |
| Mock selector-based Zustand hooks       | [references/zustand-mocking.md](references/zustand-mocking.md) | `tooling-map.md`            | Preserves selector behavior and call contracts      |
| Design Cypress E2E scope and stability  | [references/e2e-strategy.md](references/e2e-strategy.md)       | `zustand-mocking.md`        | Avoids duplicating integration concerns in UI tests |

## Expert Thinking Loop

Before implementing tests, ask in order:

1. Which boundary can fail in production: pure logic, orchestration, IO contract, or UI interaction?
2. What is the thinnest test that proves that boundary without crossing layers?
3. Which dependency is outward from this layer and therefore mockable?
4. What deterministic signal proves behavior completion (DOM role, query state, returned value)?
5. What failure mode is most likely (shape drift, stale cache, selector misuse, race) and how is it asserted?

## Critical Patterns

- Respect layer boundaries: test each layer in isolation and mock outward dependencies.
- Avoid real network and real time in unit tests.
- Prefer behavior assertions over implementation details.
- Use deterministic data and stable selectors.
- Keep tests fast and focused; do not add unnecessary async.

## NEVER Rules (with Why)

- NEVER mock both a layer and its outward dependency in the same test; this hides integration gaps and creates false
  positives.
- NEVER assert TanStack Query internals (`isFetching`, observer internals) in Presentation tests; assert
  user-visible states and outcomes.
- NEVER use arbitrary sleeps (`wait`, `setTimeout`) for UI readiness; they create timing lottery and CI-only flakes.
- NEVER snapshot unstable structures (timestamps, random IDs, query cache objects); snapshots become noisy and lose
  signal.
- NEVER mock repository mappers in Infrastructure tests; mapper-repository contracts are the behavior under
  verification.
- NEVER use E2E to validate pure business logic branches; this slows feedback and hides ownership of failures.

## Layer-Based Rules (Aligned to Current Architecture)

| Layer                                 | Type                  | Mocking                                           | Focus                                              |
| ------------------------------------- | --------------------- | ------------------------------------------------- | -------------------------------------------------- |
| Domain (`src/domain`)                 | Unit                  | No mocks                                          | Business rules, schema validation, utilities       |
| Application (`src/application`)       | Unit                  | Mock infrastructure repositories and client state | Query options, hooks logic, store actions          |
| Infrastructure (`src/infrastructure`) | Integration           | Mock HTTP boundary (MSW)                          | Repositories, mappers, DTO contracts               |
| Interface (`src/interface`)           | Integration           | Mock application boundaries as needed             | Router params, loaders, query client orchestration |
| Presentation (`src/presentation`)     | Component integration | Mock application hooks/stores                     | UI rendering, interactions, accessibility          |

## Failure Modes and Fallbacks

| Symptom                                         | Likely Cause                                  | Primary Fix                                             | Fallback                                          |
| ----------------------------------------------- | --------------------------------------------- | ------------------------------------------------------- | ------------------------------------------------- |
| Loader tests pass locally, fail in CI           | Shared query client state between tests       | Recreate query client per test and clear caches         | Force isolated test environment per suite         |
| UI test flakes on async transitions             | Asserting too early with sync queries         | Use `findBy*` and await user interactions               | Use fake timers only for timer-based logic        |
| Repository test returns unexpected shape        | DTO drift vs mapper assumptions               | Assert mapped domain output and DTO fixtures explicitly | Add contract fixture with minimal required fields |
| Hook test using Zustand selector fails randomly | Mock returns full state but not selector path | Use selector-aware mock implementation                  | Use `mockReturnValueOnce` for each selector call  |

## Mocking Policy

- Mock only at the boundary of the layer under test.
- Do not mock your own pure functions or simple utilities.
- Presentation must never mock `fetch`, `axios`, or `useQuery`.
- Infrastructure must mock network, not mappers or domain entities.
- Application may mock repositories and client state only.

## Zustand Mocking (Selectors)

- Mock Zustand hooks at the module boundary using `vi.mock`.
- If a hook accepts a selector, your mock must call it with a mock state.
- Return deterministic values per test (`mockReturnValueOnce`) when the hook is used with multiple selectors.
- Avoid mocking internal Zustand implementation details.

## Test Types & Scope Matrix

| Test Type             | Typical Layer             | Goal                                | Isolation |
| --------------------- | ------------------------- | ----------------------------------- | --------- |
| Unit                  | Domain, Application       | Behavior correctness                | High      |
| Integration           | Infrastructure, Interface | Boundary contracts                  | Medium    |
| Component integration | Presentation              | UI behavior and interactions        | Medium    |
| E2E                   | Cypress                   | End-to-end flows                    | Low       |
| Architectural         | All layers                | Layer interactions and dependencies | Variable  |

## Tooling Expectations

- Test runner: Vitest.
- UI tests: React Testing Library + `user-event`.
- Async UI: `findBy*` queries and `await`.
- Network mocking: MSW at Infrastructure and Interface boundaries.
- Hook tests: `renderHook` for application hooks only.
- E2E runner: Cypress for cross-layer user journeys and URL/navigation guarantees.

## Conventions

- Co-locate tests with the source file.
- Naming: `*.test.ts` or `*.test.tsx`.
- Prefer AAA structure (Arrange, Act, Assert).
- Use explicit assertions (`toEqual`, `toHaveLength`, `toThrow`).
- Avoid `wait()` or arbitrary delays; use fake timers if needed.

## Quality Gates

- Tests should be deterministic and fast (milliseconds, not seconds).
- No real network calls in unit tests.
- Avoid brittle selectors; use roles and labels for UI.
- Ensure async tests await the correct UI signals.

## Coverage Prioritization by Risk

1. First: business-critical flows and monetary/cart mutations.
2. Second: loader/query orchestration where params/search affect data.
3. Third: schema and mapper boundaries where API drift is likely.
4. Fourth: visual/UI regressions that impact task completion.

If coverage budget is limited, keep one high-signal test per critical branch before adding edge-case permutations.

## Code Examples

```ts
// Arrange
const input = createInput({ id: "fixed-id" });

// Act
const result = runUseCase(input);

// Assert
expect(result).toEqual({ id: "fixed-id" });
```

## Commands

```bash
vitest
vitest --watch
vitest --ui
vitest --coverage
npm run test:e2e:run
```

## Resources

- See [references/layer-matrix.md](references/layer-matrix.md) for layer mapping, file organization, and mocking
  boundaries.
- See [references/tooling-map.md](references/tooling-map.md) for tooling, setup, and Vitest features.
- See [references/async-testing.md](references/async-testing.md) for async patterns and test doubles.
- See [references/assertions.md](references/assertions.md) for AAA, assertions, parameterized tests, and snapshots.
- See [references/performance.md](references/performance.md) for performance and anti-patterns.
- See [references/zustand-mocking.md](references/zustand-mocking.md) for selector-aware Zustand mocks (Vitest/Jest).
- See [references/e2e-strategy.md](references/e2e-strategy.md) for Cypress scope, selectors, network strategy, and
  flaky-test control.

Do NOT load all reference files by default. Start with the single mandatory file selected in the router.
