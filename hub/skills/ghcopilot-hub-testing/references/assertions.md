# Assertions and Signal Quality

## Goal

Increase test signal-to-noise ratio using assertions that prove behavior contracts instead of implementation trivia.

## Assertion Depth Model

| Depth       | What It Proves                  | Example                                 |
| ----------- | ------------------------------- | --------------------------------------- |
| Presence    | Something exists                | `toBeInTheDocument()`                   |
| Contract    | Data/business output is correct | `toEqual(expectedDomainEntity)`         |
| Side effect | Integration behavior happened   | `toHaveBeenCalledWith(expectedRequest)` |

Prefer the deepest assertion needed for risk coverage.

## Matcher Selection Guide

| Intent                  | Preferred Matcher            | Avoid                                      |
| ----------------------- | ---------------------------- | ------------------------------------------ |
| Exact object contract   | `toEqual`                    | `toBe` for object literals                 |
| Partial object contract | `toMatchObject`              | Asserting every irrelevant field           |
| Collection size         | `toHaveLength`               | Manual `length === n` with generic boolean |
| Error path              | `toThrow`, `rejects.toThrow` | Generic truthy checks                      |
| Call contract           | `toHaveBeenCalledWith`       | Only checking call count                   |

## AAA Discipline for Readability

- Arrange: isolate only data needed for this behavior.
- Act: trigger one behavior.
- Assert: verify outcome relevant to the boundary.

If a test has multiple independent asserts, split into separate tests unless they describe one invariant.

## Parameterization Rule

Use `it.each` only when arrange/act shape is identical across rows.

```ts
it.each([
  { qty: 1, expected: 10 },
  { qty: 2, expected: 20 },
])("calculates total for qty=$qty", ({ qty, expected }) => {
  expect(calculateTotal(qty)).toBe(expected);
});
```

## Snapshot Policy

Use snapshots only for stable, high-structure outputs.

Never snapshot:

- Random IDs
- Timestamps
- Query cache internals
- Large UI trees that change frequently

## Assertion Anti-Patterns

- Assertion-free tests (only render/call with no `expect`).
- Over-asserting implementation details not part of contract.
- Using broad matchers (`toBeTruthy`) where exact contract is known.
- Relying on snapshots as the only assertion for critical behavior.
