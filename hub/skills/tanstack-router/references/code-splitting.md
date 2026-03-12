# Code splitting

## Rules

- Keep loader/validation in the base route.
- Lazy-load UI with `createRoute().lazy`.
- In lazy modules, use `getRouteApi` for typed hooks.

## Minimal example

```tsx
export const detailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/products/$productId',
  loader: ({ context: { queryClient }, params }) =>
    queryClient.ensureQueryData(productQueries.detail(params.productId)),
}).lazy(() => import('./productDetail.lazy').then((m) => m.Route));
```

```tsx
import { createLazyRoute, getRouteApi } from '@tanstack/react-router';

const routeApi = getRouteApi('/products/$productId');

export const Route = createLazyRoute('/products/$productId')({
  component: () => {
    const { productId } = routeApi.useParams();
    return <ProductDetailPage productId={productId} />;
  },
});
```
