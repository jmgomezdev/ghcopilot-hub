---
name: tanstack
description: >
  Implement Query + Router data flows for this Clean Architecture repo using render-as-you-fetch. Trigger: Use when
  the task involves queryOptions factories, route loaders, ensureQueryData, search params validation, query keys,
  preloading, Suspense data consumption, skeleton fallbacks, route error boundaries, mutation error feedback, or
  URL-driven data fetching with @tanstack/react-query and @tanstack/react-router.
license: Apache-2.0
metadata:
  author: jmgomezdev
  version: "1.0"
---

## When to Use

Use this skill when the task includes one or more of these signals:

- Creating or refactoring `*.queries.ts` with `queryOptions`.
- Building route loaders that must prefetch data before render.
- Mapping URL params/search to application queries.
- Implementing Suspense-based pages with TanStack Router + Query.
- Designing async UX with Suspense fallback and skeleton components.
- Handling route-level errors (404/500) with typed boundaries and retry.
- Handling mutation errors with non-blocking feedback (toasts) and retry paths.
- Fixing data waterfalls caused by component-level fetching.
- Designing query keys and invalidation strategy across feature routes.

## Reference Router (Mandatory Loading)

Loading protocol:

1. Pick one scenario first.
2. MANDATORY: Read that reference file fully before writing code.
3. Do NOT load all references by default.
4. If blocked, load only one extra reference.

| Scenario                                             | MANDATORY Reference                                                                        | Do NOT Load (unless needed)        |
| ---------------------------------------------------- | ------------------------------------------------------------------------------------------ | ---------------------------------- |
| Build or refactor query key/factory files            | [references/query-options-examples.md](references/query-options-examples.md)               | `loader-adapter-examples.md`       |
| Implement route loaders and URL adapters             | [references/loader-adapter-examples.md](references/loader-adapter-examples.md)             | `suspense-consumption-examples.md` |
| Build Suspense hooks/pages from preloaded route data | [references/suspense-consumption-examples.md](references/suspense-consumption-examples.md) | `loader-adapter-examples.md`       |
| Add route boundaries, retry, and mutation feedback   | [references/resilience-patterns.md](references/resilience-patterns.md)                     | `query-options-examples.md`        |
| Audit async/error UX regressions only                | [references/resilience-patterns.md](references/resilience-patterns.md)                     | `query-options-examples.md`        |

## Core Mindset

Before writing code, ask yourself:

1. What is the single data contract for this screen?
2. Which URL or store inputs define cache identity (`queryKey`)?
3. What belongs to the adapter (`loader`) vs business query (`application`)?
4. Can the page assume data exists via Suspense, or is partial refresh required?
5. Where should failure surface: route boundary, local fallback, or toast side-effect?

Keep this separation strict:

- Application decides query keys, queryFn, stale/gc policy.
- Interface adapts route input into query options and preloads data.
- Presentation consumes already-prepared data and renders.
- Query keys must be deterministic and serializable across navigations.
- Resilience is layered: loader/read failures -> route boundaries, mutation failures -> user feedback.

## Critical Patterns

### 1) Application: Query Options Factory

File: `src/application/{feature}/{entity}.queries.ts`

- Define stable key factories first (`all`, `lists`, `detail`).
- Export query option factories; do not inline `queryFn` in UI or loaders.
- Import repositories from infrastructure; never call `fetch/axios` directly here.
- Encode all cache identity inputs in `queryKey`.
- For full patterns and mutation invalidation examples, read
  [references/query-options-examples.md](references/query-options-examples.md).

```typescript
import { queryOptions } from "@tanstack/react-query";

import { ProductRepository } from "@/infrastructure/product/product.repository";

export const productKeys = {
  all: ["products"] as const,
  lists: () => [...productKeys.all, "list"] as const,
  list: (storeId: string, search: { q?: string; page: number }) =>
    [...productKeys.lists(), storeId, search] as const,
  details: () => [...productKeys.all, "detail"] as const,
  detail: (id: string) => [...productKeys.details(), id] as const,
};

export const productQueries = {
  list: (storeId: string, search: { q?: string; page: number }) =>
    queryOptions({
      queryKey: productKeys.list(storeId, search),
      queryFn: () => ProductRepository.getListByStore(storeId, search),
      staleTime: 1000 * 60,
    }),
  detail: (id: string) =>
    queryOptions({
      queryKey: productKeys.detail(id),
      queryFn: () => ProductRepository.getById(id),
      staleTime: 1000 * 60 * 5,
    }),
};
```

### 2) Interface: Loader as Adapter

File: `src/interface/router/routes/{feature}/*.route.ts`

- Validate search params with `zod` in `validateSearch`.
- Use `queryClient.ensureQueryData(...)` in loader for render-as-you-fetch.
- Map route params/search/store values into query factories.
- Redirect early when adapter preconditions fail (for example missing store id).
- For list/detail route examples with `loaderDeps`, read
  [references/loader-adapter-examples.md](references/loader-adapter-examples.md).

```typescript
import { createFileRoute, redirect } from "@tanstack/react-router";
import { z } from "zod";

import { productQueries } from "@/application/product/product.queries";
import { usePreferencesStore } from "@/application/product/store/preferences.store";

const searchSchema = z.object({
  q: z.string().optional(),
  page: z.number().catch(1),
});

export const Route = createFileRoute("/products")({
  validateSearch: (search) => searchSchema.parse(search),
  loader: async ({ context: { queryClient }, deps: { search } }) => {
    const storeId = usePreferencesStore.getState().storeId;

    if (!storeId) {
      throw redirect({ to: "/select-store" });
    }

    await queryClient.ensureQueryData(productQueries.list(storeId, { ...search }));
  },
  component: ProductsPage,
});
```

### 3) Presentation: Suspense Consumption

File: `src/presentation/{feature}/{Page}.page.tsx`

- Prefer an application hook that wraps `useSuspenseQuery`.
- Use `getRouteApi`/route api hooks to access typed route inputs.
- Do not branch on `isLoading`/`isError` for the initial route data path.
- For full hook+page composition examples, read
  [references/suspense-consumption-examples.md](references/suspense-consumption-examples.md).

```typescript
import { useSuspenseQuery } from "@tanstack/react-query";

import { productQueries } from "@/application/product/product.queries";
import { usePreferencesStore } from "@/application/product/store/preferences.store";

export const useProducts = (search: { q?: string; page: number }) => {
  const storeId = usePreferencesStore((state) => state.storeId);

  if (!storeId) {
    throw new Error("storeId is required to fetch products");
  }

  return useSuspenseQuery(productQueries.list(storeId, search));
};
```

### 4) Resilience: Async UI, Route Errors, and Mutation Feedback

File targets:

- Route boundaries in `src/interface/router/routes/**`.
- Skeleton fallbacks in `src/presentation/**/components/*Skeleton*.tsx`.
- Mutation feedback in `src/application/{feature}/hooks/**` or route-aware handlers.

Rules:

- Initial route data path uses Suspense + skeleton fallback, not manual `isLoading`.
- Loader errors should reach route `errorComponent`; do not swallow read failures.
- Distinguish recoverable not-found states from generic server failures.
- Mutation errors should not crash the page; show toast feedback and preserve form state.
- Keep feedback ownership aligned to layers (for example callback injection) instead of importing UI adapters into
  Application hooks.
- For complete examples, read [references/resilience-patterns.md](references/resilience-patterns.md).

## Decision Table

| Scenario                                  | Preferred approach                                    | Avoid                                                           |
| ----------------------------------------- | ----------------------------------------------------- | --------------------------------------------------------------- |
| Route entry needs data before first paint | `loader + ensureQueryData`                            | `useQuery` in page causing waterfall                            |
| URL filtering/sorting                     | `validateSearch` + typed search object in key         | Reading `URLSearchParams` directly in component                 |
| Store value required for query key        | Read once in loader with `store.getState()` and guard | Subscribing store inside loader or hidden global mutable values |
| UI needs reactive store + cached data     | Application hook: store selector + `useSuspenseQuery` | Presentation importing repository directly                      |
| Mutations affecting lists/details         | Invalidate with key factories (`lists`, `detail`)     | Invalidating raw string keys scattered in code                  |
| Route read fails during preload           | Throw to route boundary and provide retry action      | Swallowing errors in loader and rendering partial broken UI     |
| Mutation fails in form flow               | `onError` toast + keep user input for retry           | Resetting form and losing user data on failure                  |
| Feedback API ownership                    | Inject feedback callbacks from presentation adapters  | Importing presentation toast APIs inside application hooks      |

## Cache Policy Heuristics

Use these defaults unless a feature has explicit product constraints:

- Frequently changing lists: `staleTime` 30s-2m, invalidate on write.
- Detail pages with low volatility: `staleTime` 5m-15m.
- Expensive datasets reused across tabs: set `gcTime` >= `staleTime`.
- Filter-heavy UIs: include normalized filters in `queryKey` and keep `placeholderData` decisions in Application
  hooks.

## Never Do This

Never do these, because they create hard-to-debug regressions:

- Never define `queryFn` in presentation or route files; it breaks cache ownership.
- Never use DTO types in presentation; map DTO to domain in infrastructure.
- Never parse URL search manually in components; duplicate parsing drifts from router contract.
- Never mix `prefetchQuery` + ad-hoc state assumptions for critical route data.
- Never build query keys with unstable objects/functions; unstable identity causes cache misses.
- Never add top-level manual loading branches for initial route data if loader prefetch exists.
- Never catch loader read errors only to return fallback fake data; it hides production failures.
- Never crash full page on mutation error; use non-blocking feedback and allow retry.
- Never import presentation-only feedback adapters into Application hooks.

## Skill Escalation Rules

Load other skills when the task goes beyond baseline flow:

- MANDATORY: also load `tanstack-query` for optimistic updates, infinite queries, retry tuning, or mutation
  lifecycle complexity.
- MANDATORY: also load `tanstack-router` for nested route composition, advanced search/state syncing, or route
  masking.
- Do not load extra skills for simple detail/list prefetch flows; keep this skill as the default baseline.

## Failure Modes and Fallbacks

- Search parsing fails: Use `validateSearch` with safe defaults (`catch`) or route-level error UI.
- Loader precondition fails (missing id/store): Redirect from loader before query execution.
- Loader fetch throws (network/500): Let the route boundary render a recoverable error view with retry.
- Loader fetch returns not found (404-like): Map to typed not-found experience in error boundary.
- Data can be stale but UI must stay responsive after mutation: Use targeted invalidation and keep `staleTime`
  explicit per use case.
- Page combines route data and user-driven live filters: Keep route-critical preload in loader, then use client-side
  query updates for local interactions.
- Mutation fails after user input: Keep entered values, surface toast, and provide explicit retry action.

## Quality Gate (Self-Check)

Before finishing, verify all checks pass:

- `queryFn` appears only in `application/*/*.queries.ts`.
- Loaders call `ensureQueryData` for initial route data.
- `validateSearch` exists when search params are used.
- Presentation imports application hooks/queries, not repositories/DTOs.
- Query keys are centralized and reused for invalidation.
- Suspense path exists for first render data.
- Route-level `errorComponent` exists for remote-data routes.
- Mutation paths define user-facing error feedback.
- Skeleton fallback exists for heavy initial route loads.

## Commands

Use VS Code native search (`#tool:search`) instead of terminal `grep`:

- Suspicious fetch in Presentation/Interface: `query: fetch\(|axios\.|queryFn` (regex), paths: `src/presentation`,
  `src/interface`
- Loaders and `validateSearch` usage: `query: loader:|validateSearch:` (regex), path: `src/interface/router/routes`
- Query key factories: `query: Keys\s*=|queryOptions\(` (regex), path: `src/application`
- Route boundaries and retry hooks: `query: errorComponent|invalidate\(` (regex), paths:
  `src/interface/router/routes`, `src/presentation`
- Mutation error handlers: `query: useMutation\(|onError|toast\.` (regex), paths: `src/application`,
  `src/presentation`
- Potential Application -> Presentation feedback leaks: `query: ^import .*@/presentation/.+toast` (regex), path:
  `src/application`

## Resources

- Query options and invalidation examples:
  [references/query-options-examples.md](references/query-options-examples.md)
- Loader adapter route examples: [references/loader-adapter-examples.md](references/loader-adapter-examples.md)
- Suspense hook and page examples:
  [references/suspense-consumption-examples.md](references/suspense-consumption-examples.md)
- Resilience patterns for async/error UX: [references/resilience-patterns.md](references/resilience-patterns.md)
