# Zustand Mocking for Selector-Based Hooks

## Goal

Mock Zustand stores without breaking selector semantics, call contracts, or test determinism.

## Core Rule

If production code calls `useStore(selector)`, the mock must execute the selector against a deterministic mock state.

## Selector-Aware Mock Factory

```ts
import { vi } from "vitest";

type SearchState = {
  input: string;
  submitted: string;
  setInput: (value: string) => void;
  reset: () => void;
};

export const mockUseSearchStore = vi.fn();

export const setupSearchStoreMock = (overrides: Partial<SearchState> = {}) => {
  const state: SearchState = {
    input: "",
    submitted: "",
    setInput: vi.fn(),
    reset: vi.fn(),
    ...overrides,
  };

  mockUseSearchStore.mockImplementation((selector?: (s: SearchState) => unknown) =>
    selector ? selector(state) : state
  );

  return state;
};
```

## Module Boundary Mocking Pattern

```ts
import { vi } from "vitest";
import { mockUseSearchStore } from "../test/mocks/search-store.mock";

vi.mock("@/application/product/store/search.store", () => ({
  useSearchStore: mockUseSearchStore,
}));
```

## Multi-Selector Call Handling

When a hook calls the same store multiple times with different selectors:

- Preferred: selector-aware implementation with one coherent state.
- Fallback: `mockReturnValueOnce` sequence only when selectors are hard to model.

## Reset Discipline

```ts
import { afterEach, vi } from "vitest";

afterEach(() => {
  vi.clearAllMocks();
});
```

If a test mutates mocked state, recreate it per test to avoid bleed-through.

## Common Failures and Fixes

| Symptom                         | Cause                                             | Fix                                    |
| ------------------------------- | ------------------------------------------------- | -------------------------------------- |
| Selector returns `undefined`    | Mock returned plain value, not selector output    | Use selector-aware mock implementation |
| Assertions depend on call order | Multiple selectors mocked with fragile sequencing | Use single coherent mock state         |
| Random cross-test failures      | Reused mutated state                              | Recreate state in each test            |

## Never Do

- Never use the real Zustand store in unit tests when deterministic isolation is required.
- Never mock internal Zustand implementation primitives.
- Never return full state object when production consumes selectors only.
