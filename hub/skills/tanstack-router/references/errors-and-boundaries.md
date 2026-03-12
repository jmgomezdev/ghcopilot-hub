# Errors and boundaries

Use this reference when implementing route-level error behavior for loader-driven pages.

## Rules

- Loader read failures should propagate to route `errorComponent`.
- Keep not-found UI separate from generic server/network failures.
- Retry should invalidate router/query state, not hard reload the page.
- Do not mask loader failures by returning fake fallback payloads.

## Minimal route boundary pattern

```tsx
import { createFileRoute, useRouter } from "@tanstack/react-router";

import { productQueries } from "@/application/product/product.queries";

const isNotFoundError = (error: unknown) => error instanceof Error && error.message.includes("404");

function ProductDetailErrorBoundary({ error }: { error: unknown }) {
  const router = useRouter();

  if (isNotFoundError(error)) {
    return <ProductNotFound />;
  }

  return <RouteErrorPage title="Unable to load product" onRetry={() => router.invalidate()} />;
}

export const Route = createFileRoute("/products/$productId")({
  loader: async ({ params, context: { queryClient } }) => {
    await queryClient.ensureQueryData(productQueries.detail(params.productId));
  },
  errorComponent: ProductDetailErrorBoundary,
  component: ProductDetailPage,
});
```

## Common pitfalls

- Catching inside loader and returning synthetic data.
- Rendering route errors inside page components instead of boundaries.
- Using full page reload for retry.
