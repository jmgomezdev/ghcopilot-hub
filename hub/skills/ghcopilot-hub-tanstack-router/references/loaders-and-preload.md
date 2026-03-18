# Loaders and preload

## Rules

- Required data must be loaded in loaders with `ensureQueryData`.
- Use `Promise.all` for parallel loading.
- Use `defaultPreload: 'intent'` and `defaultPreloadStaleTime: 0` with TanStack Query.
- Keep loader failures visible to route boundaries; do not return fake fallback data from loader catches.

## Boundary hand-off

When loader data is required for first render, pair loader prefetch with route `errorComponent`.

```tsx
export const detailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/products/$productId",
  loader: async ({ context: { queryClient }, params }) => {
    await queryClient.ensureQueryData(productQueries.detail(params.productId));
  },
  errorComponent: ProductDetailErrorBoundary,
  component: ProductDetailPage,
});
```

Retry should invalidate router/query state (for example `router.invalidate()`), not hard refresh.

## Minimal example

```tsx
export const detailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/products/$productId",
  loader: async ({ context: { queryClient }, params }) => {
    await Promise.all([
      queryClient.ensureQueryData(productQueries.detail(params.productId)),
      queryClient.ensureQueryData(productQueries.related(params.productId)),
    ]);
  },
  component: ProductDetailPage,
});
```

```tsx
export const router = createRouter({
  routeTree,
  context: { queryClient },
  defaultPreload: "intent",
  defaultPreloadStaleTime: 0,
});
```
