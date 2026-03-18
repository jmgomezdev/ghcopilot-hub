# Resilience Patterns (TanStack Flow)

Load this file when implementing async UX behavior, route-level error handling, or mutation failure feedback.

## 1) Suspense + Skeleton for Initial Route Data

Use this when route data is preloaded with `ensureQueryData`.

```tsx
import { Suspense } from "react";

import { ProductListPage } from "@/presentation/product/ProductList.page";
import { ProductListSkeleton } from "@/presentation/product/components/ProductListSkeleton";

export const ProductListWithFallback = () => {
  return (
    <Suspense fallback={<ProductListSkeleton />}>
      <ProductListPage />
    </Suspense>
  );
};
```

Guidelines:

- Skeleton shape should mirror real layout to avoid jarring transitions.
- Do not add route-initial `isLoading` branches in the page if Suspense already wraps it.

## 2) Route Error Boundary (404 vs 500 + Retry)

Use this for routes that fetch remote data in `loader`.

```tsx
import { createFileRoute, useRouter } from "@tanstack/react-router";

import { productQueries } from "@/application/product/product.queries";
import { NotFoundPage } from "@/presentation/shared/components/NotFoundPage";
import { RouteErrorPage } from "@/presentation/shared/components/RouteErrorPage";

const isNotFoundError = (error: unknown) => error instanceof Error && error.message.includes("404");

function ProductsErrorBoundary({ error }: { error: unknown }) {
  const router = useRouter();

  if (isNotFoundError(error)) {
    return <NotFoundPage />;
  }

  return <RouteErrorPage title="Unable to load products" onRetry={() => router.invalidate()} />;
}

export const Route = createFileRoute("/products")({
  loader: async ({ context: { queryClient }, params }) => {
    await queryClient.ensureQueryData(productQueries.detail(params.productId));
  },
  errorComponent: ProductsErrorBoundary,
  component: ProductsPage,
});
```

Guidelines:

- Throw from loader to boundary instead of swallowing errors.
- Classify not-found paths separately from generic failures.
- Retry should invalidate route/query state, not force full page reload.

## 3) Mutation Error Feedback without Page Crash

Use this for write operations (forms, toggles, destructive actions).

```typescript
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { productKeys } from "@/application/product/product.queries";
import { ProductRepository } from "@/infrastructure/product/product.repository";

export const useUpdateProduct = (
  onSuccessFeedback: (message: string) => void,
  onErrorFeedback: (message: string) => void
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ProductRepository.update,
    onSuccess: async (updated) => {
      await queryClient.invalidateQueries({
        queryKey: productKeys.detail(updated.id),
      });
      onSuccessFeedback("Product updated");
    },
    onError: () => {
      onErrorFeedback("Failed to update product. Please retry.");
    },
  });
};
```

Guidelines:

- Keep user-entered state when mutation fails.
- Keep feedback adapters (toast/snackbar) in Presentation and inject callbacks.
- Prefer focused feedback (toast/inline message) over global crash UI.
- Retry should be user-driven and explicit.

## Decision Checklist

- Is this route-initial data? Use Suspense + boundary.
- Is this a user write action? Use mutation `onError` feedback.
- Is this a recoverable not-found case? Route-level typed not-found UI.
- Is this transient infra failure? Show retry action and preserve user context.
