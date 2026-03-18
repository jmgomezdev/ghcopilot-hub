---
name: ghcopilot-hub-tanstack-router
description: >
  TanStack Router patterns aligned with the project Clean Architecture and the ghcopilot-hub-tanstack skill. Trigger: When
  implementing or refactoring routing, loaders, search params, router defaults, route-level error boundaries, and
  recovery flows.
license: Apache-2.0
metadata:
  author: jmgomezdev
  version: "1.0"
---

## When to Use

- Creating or updating TanStack Router routes, loaders, and router configuration.
- Adding search param validation, preload strategy, or error/not-found handling.
- Splitting route components with `.lazy.tsx` and `getRouteApi()`.
- Using advanced routing behaviors like masks or custom search serialization.

## Reference Router (Mandatory Loading)

Loading protocol:

1. Pick one routing scenario first.
2. MANDATORY: read only the selected reference before implementation.
3. Do NOT load all references by default.
4. If blocked, load one extra reference only.

| Scenario                                 | MANDATORY Reference                                                        | Do NOT Load (unless needed) |
| ---------------------------------------- | -------------------------------------------------------------------------- | --------------------------- |
| Loader flow and preload orchestration    | [references/loaders-and-preload.md](references/loaders-and-preload.md)     | `navigation.md`             |
| Route-level boundary and recovery UX     | [references/errors-and-boundaries.md](references/errors-and-boundaries.md) | `code-splitting.md`         |
| Search params parsing and defaults       | [references/search-params.md](references/search-params.md)                 | `private-routes.md`         |
| Context wiring and typed root route      | [references/router-context.md](references/router-context.md)               | `navigation.md`             |
| Private/public redirects and auth groups | [references/private-routes.md](references/private-routes.md)               | `search-params.md`          |
| Lazy route modules and route API typing  | [references/code-splitting.md](references/code-splitting.md)               | `private-routes.md`         |
| Navigation, links, masks                 | [references/navigation.md](references/navigation.md)                       | `router-context.md`         |

## Critical Patterns

- **Follow the `ghcopilot-hub-tanstack` skill** for render-as-you-fetch: Application owns `queryOptions`, Interface uses loaders,
  Presentation consumes with `useSuspenseQuery`.
- **Interface-only routing:** route files live under `src/interface/router/**` and never call repositories directly.
- **Use typed router context:** create root with `createRootRouteWithContext` and inject `queryClient` (and auth if
  needed).
- **Loaders use `queryClient.ensureQueryData`**, never `prefetchQuery`, and never fetch directly in components.
- **Always validate search params** with `validateSearch` and `ghcopilot-hub-zod` (defaults via `.catch`).
- **Register the router type** once so `useNavigate`, `Link`, and hooks infer valid routes.
- **Prefer `<Link>` over `useNavigate`** for normal navigation (accessibility + preloading).
- **Use `from` / `Route.fullPath` / `getRouteApi()`** for strict type narrowing in components.
- **Use parallel loaders** (`Promise.all`) to avoid waterfalls.
- **Use `.lazy.tsx`** for heavy UI components; keep config in the main route file.
- **Configure not-found handling** with `notFoundComponent` or `defaultNotFoundComponent`.
- **Route read failures must bubble** to `errorComponent`; never swallow loader failures.
- **Classify errors at route boundary**: not-found UX separate from generic server/infrastructure errors.
- **Retry from route boundaries** with `router.invalidate()` (or equivalent route reset), not full reload.
- **Preload intent by default** and set `defaultPreloadStaleTime: 0` when using TanStack Query.
- **Private routes:** use pathless route groups with `beforeLoad` redirects and auth context. See
  `references/private-routes.md`.

## Code Examples

### Loader + Query cache (minimal)

```tsx
import { createFileRoute } from "@tanstack/react-router";

import { productQueries } from "@/application/product/product.queries";

export const Route = createFileRoute("/products/$productId")({
  loader: async ({ params, context: { queryClient } }) => {
    await queryClient.ensureQueryData(productQueries.detail(params.productId));
  },
  errorComponent: ProductDetailErrorBoundary,
  component: ProductDetailPage,
});
```

### Search validation with Zod (minimal)

```tsx
import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

const searchSchema = z.object({
  page: z.number().min(1).catch(1),
  sort: z.enum(["name", "price"]).catch("name"),
});

export const Route = createFileRoute("/products")({
  validateSearch: (search) => searchSchema.parse(search),
  component: ProductsPage,
});
```

### Strict types in split components (minimal)

```tsx
import { getRouteApi } from "@tanstack/react-router";

const route = getRouteApi("/products/$productId");

export function ProductHeader() {
  const { productId } = route.useParams();
  return <h1>Product {productId}</h1>;
}
```

## Commands

```bash
npm run lint
npm run test
npm run build
```

Use VS Code native search (`#tool:search`) for route boundary checks:

- `query: loader:|errorComponent|notFoundComponent` (regex), path: `src/interface/router/routes`

## Failure Modes and Fallbacks

- Loader throws and UI stays blank: Ensure route defines `errorComponent` and retry path.
- Not-found and server errors render the same UI: Split boundary handling into typed not-found and generic error
  branches.
- Navigation recovery uses hard refresh: Replace with router/query invalidation strategy.

## Never Do This

- Never catch loader errors only to return fake placeholder payloads.
- Never implement route error handling solely inside page components.
- Never use `prefetchQuery` for required route data in router flow.

## Resources

- Base skill: [../ghcopilot-hub-tanstack/SKILL.md](../ghcopilot-hub-tanstack/SKILL.md)
- Base skill: [../ghcopilot-hub-tanstack-query/SKILL.md](../ghcopilot-hub-tanstack-query/SKILL.md)
- Router context: [references/router-context.md](references/router-context.md)
- Loaders and preload: [references/loaders-and-preload.md](references/loaders-and-preload.md)
- Errors and boundaries: [references/errors-and-boundaries.md](references/errors-and-boundaries.md)
- Search params: [references/search-params.md](references/search-params.md)
- Navigation: [references/navigation.md](references/navigation.md)
- Code splitting: [references/code-splitting.md](references/code-splitting.md)
- TypeScript: [references/typescript.md](references/typescript.md)
- Private routes: [references/private-routes.md](references/private-routes.md)
