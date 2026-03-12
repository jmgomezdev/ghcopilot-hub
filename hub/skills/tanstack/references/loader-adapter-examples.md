# Loader Adapter Examples

Use these examples when implementing routes in `src/interface/router/routes/**`.

## A. List Route with Search Validation and Preload

```typescript
import { createFileRoute, redirect } from '@tanstack/react-router';
import { z } from 'zod';

import { productQueries } from '@/application/product/product.queries';
import { usePreferencesStore } from '@/application/product/store/preferences.store';
import { ProductListPage } from '@/presentation/product/ProductList.page';

const listSearchSchema = z.object({
  q: z.string().optional(),
  category: z.string().optional(),
  page: z.number().catch(1),
  pageSize: z.number().catch(20),
});

export const Route = createFileRoute('/products/')({
  validateSearch: (search) => listSearchSchema.parse(search),
  loaderDeps: ({ search }) => ({ search }),
  loader: async ({ context: { queryClient }, deps: { search } }) => {
    const storeId = usePreferencesStore.getState().storeId;

    if (!storeId) {
      throw redirect({ to: '/select-store' });
    }

    await queryClient.ensureQueryData(productQueries.list(storeId, search));
  },
  component: ProductListPage,
});
```

## B. Detail Route with Param Mapping

```typescript
import { createFileRoute } from '@tanstack/react-router';

import { productQueries } from '@/application/product/product.queries';
import { ProductDetailPage } from '@/presentation/product/ProductDetail.page';

export const Route = createFileRoute('/products/$productId')({
  loader: async ({ context: { queryClient }, params }) => {
    await queryClient.ensureQueryData(productQueries.detail(params.productId));
  },
  component: ProductDetailPage,
});
```

## C. Adapter Rules

- Route files adapt URL and store input into application query factories.
- Do not call repositories directly inside route loaders.
- Use redirects for missing prerequisites before preloading.
- Validate search in router, not in components.

## D. Route Error Boundary Hand-off

Use this pattern when loader reads can fail with recoverable UX:

```typescript
export const Route = createFileRoute('/products')({
  loader: async ({ context: { queryClient }, params }) => {
    await queryClient.ensureQueryData(productQueries.detail(params.productId));
  },
  errorComponent: ProductsErrorBoundary,
  component: ProductDetailPage,
});
```

Rules:

- Throw loader errors to route `errorComponent`; do not convert to fake fallback data.
- Keep not-found and generic failure rendering separated.
- See [resilience-patterns.md](resilience-patterns.md) for full 404/500 and retry examples.
