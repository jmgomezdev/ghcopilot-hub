---
name: ghcopilot-hub-tanstack-query
description: >
  Advanced TanStack Query v5 extensions. Trigger: when implementing advanced Query patterns, v5 migrations, cache
  optimizations, mutation lifecycle handling, or query error propagation strategies.
license: Apache-2.0
metadata:
  author: jmgomezdev
  version: "1.0"
---

## Required Base

This skill **always** applies **after** the `ghcopilot-hub-tanstack` skill and **never** contradicts it.

- Direct reference: use the `ghcopilot-hub-tanstack` skill as the mandatory foundation.
- Everything not mentioned here follows `ghcopilot-hub-tanstack` rules.

## Objective

Provide advanced rules, v5 issue prevention, and cache optimization patterns that complement the
“render-as-you-fetch” flow defined in `ghcopilot-hub-tanstack`.

## Dependencies

- Base skill: ghcopilot-hub-tanstack
- Packages: @tanstack/react-query

## Render-as-you-fetch Alignment (ghcopilot-hub-tanstack)

This skill **extends** the render-as-you-fetch flow defined in the `ghcopilot-hub-tanstack` skill:

- Define `queryOptions` / `infiniteQueryOptions` in Application.
- Use Router loaders with `queryClient.ensureQueryData` / `ensureInfiniteQueryData`.
- Prefer consuming in Presentation via an Application hook that wraps `useSuspenseQuery` /
  `useSuspenseInfiniteQuery`. Use direct hooks only for very simple cases.
- Never fetch server data in `useEffect`.

## References

- Base tanstack skill: [.github/skills/ghcopilot-hub-tanstack/SKILL.md](../ghcopilot-hub-tanstack/SKILL.md)
- Advanced patterns and hooks: [references/advanced-hooks.md](references/advanced-hooks.md)
- Cache strategies: [references/cache-strategies.md](references/cache-strategies.md)
- Best practices: [references/best-practices.md](references/best-practices.md)
- Common patterns: [references/common-patterns.md](references/common-patterns.md)
- Top errors & fixes: [references/top-errors.md](references/top-errors.md)
- Resilience and mutations: [references/resilience-and-mutations.md](references/resilience-and-mutations.md)
- TypeScript patterns: [references/typescript.md](references/typescript.md)
- v4 → v5 migration: [references/migration-v5.md](references/migration-v5.md)
- Testing: [references/testing.md](references/testing.md)

## Reference Router (Mandatory Loading)

Loading protocol:

1. Pick one scenario first.
2. MANDATORY: read only the selected reference before implementing.
3. Do NOT load all references by default.
4. If blocked, load exactly one additional reference.

| Scenario                                                                     | MANDATORY Reference                                                              | Do NOT Load (unless needed) |
| ---------------------------------------------------------------------------- | -------------------------------------------------------------------------------- | --------------------------- |
| Advanced hook composition (`useQueries`, `useMutationState`, infinite hooks) | [references/advanced-hooks.md](references/advanced-hooks.md)                     | `migration-v5.md`           |
| Cache lifetimes, invalidation, refetch strategy                              | [references/cache-strategies.md](references/cache-strategies.md)                 | `migration-v5.md`           |
| v5 migration and API breakages                                               | [references/migration-v5.md](references/migration-v5.md)                         | `advanced-hooks.md`         |
| Query errors, callback confusion, common pitfalls                            | [references/top-errors.md](references/top-errors.md)                             | `testing.md`                |
| Mutation resilience and feedback ownership                                   | [references/resilience-and-mutations.md](references/resilience-and-mutations.md) | `migration-v5.md`           |
| Query typing constraints and TS inference                                    | [references/typescript.md](references/typescript.md)                             | `cache-strategies.md`       |

## Compatibility Checklist with ghcopilot-hub-tanstack

Before applying this skill, confirm:

1. Use of queryOptions and loaders per ghcopilot-hub-tanstack.
2. Object syntax in hooks.
3. Query keys as arrays.
4. Suspense + loaders for required data.

## Quick Application (Summary)

- `useMutationState` for global tracking.
- `networkMode` for offline/PWA.
- `useQueries` with `combine` for aggregated parallel results.
- `infiniteQueryOptions` and `maxPages` for efficient pagination.
- v5 issue prevention (removed callbacks, `gcTime`, `isPending`).

## Essential Rules (Must)

- Use object syntax and array query keys everywhere.
- Keep route-required data in the ghcopilot-hub-tanstack flow (Application `queryOptions` → Loader `ensureQueryData` →
  Presentation `useSuspenseQuery`).
- Set `staleTime` by data volatility and `gcTime` by revisit frequency.
- Invalidate with precise keys after mutations; use `refetchType: 'all'` only when inactive queries must refetch.
- Optimistic updates require: `cancelQueries` → snapshot → optimistic `setQueryData` → rollback on error →
  invalidate on settle.
- Infinite queries must set `initialPageParam`; `maxPages` requires bi-directional pagination.
- Use `useQueries` for optional/secondary data, not required route data.
- Use `prefetchQuery` only for optional navigation (hover/background), never for required route data.
- Keep mutation feedback layer-safe: inject feedback callbacks or return mutation state; do not import presentation
  toasts in Application hooks.

## TanStack Query v5 — Critical Rules, Issues, and Anti‑Patterns

> These rules **extend** the ghcopilot-hub-tanstack skill. If there is a conflict, ghcopilot-hub-tanstack wins.

### Critical Rules (Always Do)

✅ Use object syntax in all hooks:

```tsx
useQuery({ queryKey, queryFn, ...options });
useMutation({ mutationFn, ...options });
```

✅ Query keys always as arrays:

```tsx
queryKey: ["todos"];
queryKey: ["todos", id];
queryKey: ["todos", { filter }];
```

✅ Configure `staleTime` appropriately for the use case.

✅ Use `isPending` for initial loading state.

✅ Always throw `Error` in `queryFn` on failure.

✅ Invalidate queries after mutations with `queryClient.invalidateQueries`.

✅ Use `queryOptions` for reusable patterns.

✅ Use `gcTime`, not `cacheTime`.

### Forbidden (Never Do)

❌ v4 syntax (array/function).

❌ Callbacks in queries (`onSuccess`, `onError`, `onSettled`) - this does not apply to mutations.

❌ `cacheTime`, `isLoading` for initial state, `keepPreviousData`, `useErrorBoundary`.

❌ Using `enabled` with `useSuspenseQuery`.

❌ Omitting `initialPageParam` in infinite queries.

❌ Relying on `refetchOnMount: false` for errored queries (use `retryOnMount: false`).

### Known Issues and Prevention

#### #2 Query callbacks removed

- **Problem:** callbacks do not exist in v5 queries.
- **Prevention:** use `useEffect` with `data`.
- **Note:** mutation callbacks remain valid and are expected for optimistic flows and feedback.

#### #3 `status: loading` → `pending`

- **Problem:** UI out of sync.
- **Prevention:** use `isPending` for initial load.

#### #4 `cacheTime` → `gcTime`

- **Problem:** type errors.
- **Prevention:** replace with `gcTime`.

#### #5 `useSuspenseQuery` + `enabled`

- **Problem:** `enabled` not available.
- **Prevention:** conditional rendering outside the hook.

#### #6 `initialPageParam` required

- **Problem:** type errors.
- **Prevention:** set `initialPageParam` explicitly.

#### #7 `keepPreviousData` removed

- **Prevention:** `placeholderData: keepPreviousData`.

#### #8 Default Error type

- **Prevention:** throw `Error` or type the error explicitly.

#### #12 Mutation callback signature change (v5.89.0+)

- **Problem:** callbacks receive 4 parameters.
- **Prevention:** use `(data, variables, onMutateResult, context)` signature.

#### #13 Readonly query keys break partial matching (v5.90.8)

- **Prevention:** upgrade to v5.90.9+.

#### #14 `useMutationState` loses inference

- **Prevention:** cast in `select`.

#### #15 Cancellation in StrictMode with `fetchQuery`

- **Prevention:** expected behavior; use `staleTime: Infinity` to keep it observed.

#### #16 `invalidateQueries` only refetches active queries

- **Prevention:** use `refetchType: 'all'` if you need inactive ones.

### Community Tips

#### Different options in the same query

- “Last write wins” for future options.
- **Recommended:** compute options on render using functions.

#### `refetch()` is not for new parameters

- **Rule:** change parameters in the `queryKey` and let Query refetch.

### Anti‑Patterns (FORBIDDEN)

```ts
// Do not store server state in Zustand/Redux
// Do not use string query keys
// Do not use cacheTime
// Do not use isLoading for initial state
// Do not invalidate EVERYTHING indiscriminately
// Do not forget cancelQueries in optimistic updates
// Do not mutate cache data directly
// Do not fetch in useEffect
// Do not import presentation feedback adapters (toast/snackbar) into application mutation hooks
```

> For complete examples, see the ghcopilot-hub-tanstack skill.

## Quality Gate (Self-Check)

Before finishing, verify:

- Query hooks use v5 object syntax and array query keys.
- Route-critical reads still follow loader + Suspense flow from `ghcopilot-hub-tanstack`.
- Query callbacks are not used (mutations may use callbacks).
- Mutation feedback does not import presentation adapters into Application hooks.
- Invalidation uses key factories and avoids broad indiscriminate invalidation.
