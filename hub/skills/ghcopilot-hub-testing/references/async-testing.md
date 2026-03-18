# Async Testing Playbook

## Goal

Eliminate race conditions and flaky waits by matching each async source with the right synchronization signal.

## Async Source Matrix

| Async Source               | Correct Wait Strategy                | Deterministic Signal               | Common Failure                             |
| -------------------------- | ------------------------------------ | ---------------------------------- | ------------------------------------------ |
| Promise-returning function | `await expect(...).resolves/rejects` | resolved value or thrown error     | Missing `await` leading to false positives |
| UI async render            | `await screen.findBy*`               | role/text visible                  | Asserting with `getBy*` too early          |
| User interaction cascade   | `await user.click/type` + `findBy*`  | post-action UI state               | Mixing sync and async user-event APIs      |
| Timer-based behavior       | fake timers + controlled advance     | callback/result after time advance | Real timers in CI produce random delays    |
| Query refetch/invalidation | await final UI/data state            | stable post-mutation output        | Asserting intermediate fetching states     |

## Completion Signals by Layer

- Domain/Application: return value, explicit thrown error, called dependency contract.
- Infrastructure: expected mapped output after mocked HTTP response.
- Interface: loader result/redirect after validated params.
- Presentation: accessible UI state reached after interaction.
- E2E: final URL + visible business outcome.

## Reliable Async Sequence

1. Arrange deterministic async source.
2. Trigger exactly one async action.
3. Await one business-relevant completion signal.
4. Assert final state only.

## Rejection Testing Pattern

```ts
await expect(runUseCase(input)).rejects.toThrow("Invalid state");
```

Avoid wrapping async call in `expect(() => ...)` for rejected promises.

## Timer Control Pattern

```ts
import { vi } from "vitest";

vi.useFakeTimers();
startCountdown();
vi.advanceTimersByTime(1000);
expect(onTick).toHaveBeenCalledTimes(1);
vi.useRealTimers();
```

Always restore timers to avoid cross-test leakage.

## Flake Triage (Async)

| Symptom                      | Likely Cause                   | Fix                                    |
| ---------------------------- | ------------------------------ | -------------------------------------- |
| Passes locally, fails in CI  | Hidden timing dependency       | Replace sleeps with signal-based waits |
| Intermittent missing element | Query before render completion | Switch `getBy*` to `findBy*`           |
| Random extra calls           | Retries enabled                | Disable retries for tests              |

## Never Do

- Never use arbitrary `wait(500)` to "stabilize" tests.
- Never assert transient loading states as final assertions unless explicitly required.
- Never mix callback-style `done` with async/await in the same test.
