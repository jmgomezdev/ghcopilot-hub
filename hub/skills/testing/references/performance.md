# Performance and Flake Control

## Goal

Keep feedback fast while preserving deterministic confidence.

## Performance Budget Heuristic

| Test Type             | Target Runtime                  | Budget Strategy                    |
| --------------------- | ------------------------------- | ---------------------------------- |
| Unit                  | < 50ms per test (typical)       | No network, no heavy setup         |
| Integration           | < 200ms per test (typical)      | Isolated MSW handlers and fixtures |
| Component integration | < 300ms per test (typical)      | Render minimal tree                |
| E2E                   | Minutes per suite, not per spec | Cover critical journeys only       |

Treat values as heuristics; regressions matter more than absolute numbers.

## Flake Triage Protocol

1. Reproduce with repeated runs (`--runInBand` style strategy if needed).
2. Identify non-deterministic source (time, data, shared state, retries).
3. Replace delay-based waits with signal-based waits.
4. Isolate mutable globals (QueryClient, store, handlers) per test.
5. Confirm stability with repeated execution.

## High-Impact Speed Wins

- Build fixtures once and clone immutable data per test.
- Reset mocks/handlers in `afterEach`.
- Keep query retries disabled in test runtime.
- Avoid rendering full app shell when a focused component/hook harness is enough.

## CI Stability Rules

- Fail on unhandled requests in MSW.
- Avoid tests that depend on local timezone or locale defaults.
- Keep E2E data setup isolated per scenario.

## E2E Throughput Strategy

- One spec per critical journey instead of many tiny overlapping specs.
- Prefer deterministic setup APIs over UI setup steps when available.
- Capture one clear business assertion per major step to improve failure diagnosis.

## Never Do

- Never hide flakes with retries as the first response.
- Never share mutable singleton state across suites without reset.
- Never add arbitrary sleeps to reduce CI failures.
