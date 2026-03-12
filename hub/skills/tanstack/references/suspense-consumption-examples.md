# Suspense Consumption Examples

Use these examples in `src/application/{feature}/hooks` and `src/presentation/{feature}`.

## A. Application Hook for Route Search Data

```typescript
import { useSuspenseQuery } from "@tanstack/react-query";
import { getRouteApi } from "@tanstack/react-router";

import { productQueries } from "@/application/product/product.queries";
import { usePreferencesStore } from "@/application/product/store/preferences.store";

const productsRouteApi = getRouteApi("/products/");

export const useProductsFromRoute = () => {
  const search = productsRouteApi.useSearch();
  const storeId = usePreferencesStore((state) => state.storeId);

  if (!storeId) {
    throw new Error("storeId is required to fetch products");
  }

  return useSuspenseQuery(productQueries.list(storeId, search));
};
```

## B. Presentation Page Consuming Application Hook

```tsx
import { useProductsFromRoute } from "@/application/product/hooks/useProductsFromRoute";

export const ProductListPage = () => {
  const { data } = useProductsFromRoute();

  return (
    <section>
      <h1>Products</h1>
      <ul>
        {data.items.map((product) => (
          <li key={product.id}>{product.name}</li>
        ))}
      </ul>
    </section>
  );
};
```

## C. Partial Refresh Pattern

When the page has route-critical data and local UI interactions:

- Keep initial data preload in loader + `ensureQueryData`.
- Use query-keyed local controls for client-side refetches.
- Avoid returning to manual `isLoading` guards for first render.

## D. Suspense Rules

- Prefer Suspense path for first route render data.
- Keep error handling in route boundaries or route-level components.
- Reserve direct presentation-level `useSuspenseQuery` for very simple pages.

## E. Route Entry Fallback Composition

```tsx
import { Suspense } from "react";

import { ProductListPage } from "@/presentation/product/ProductList.page";
import { ProductListSkeleton } from "@/presentation/product/components/ProductListSkeleton";

export const ProductListRouteView = () => (
  <Suspense fallback={<ProductListSkeleton />}>
    <ProductListPage />
  </Suspense>
);
```

Guidelines:

- Keep fallback shape aligned to page layout.
- Avoid parallel manual `isLoading` branches for the same initial route data.
- See [resilience-patterns.md](resilience-patterns.md) for error boundary and retry patterns.
