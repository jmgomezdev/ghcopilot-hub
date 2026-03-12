# Router context

## Rules

- Use `createRootRouteWithContext` to type router context.
- Inject shared services via `createRouter` context.
- Access `context.queryClient` inside loaders.
- Avoid global imports inside route files.

## Minimal example

```tsx
import type { QueryClient } from '@tanstack/react-query';
import {
  createRootRouteWithContext,
  createRoute,
  createRouter,
} from '@tanstack/react-router';

type RouterContext = { queryClient: QueryClient };

export const rootRoute = createRootRouteWithContext<RouterContext>()({
  component: RootLayout,
});

export const listRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  loader: async ({ context: { queryClient } }) => {
    await queryClient.ensureQueryData(productQueries.list());
  },
  component: ProductListPage,
});

export const router = createRouter({
  routeTree: rootRoute.addChildren([listRoute]),
  context: { queryClient },
});
```
