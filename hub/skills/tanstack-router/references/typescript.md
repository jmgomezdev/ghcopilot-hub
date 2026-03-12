# TypeScript

## Rules

- Register the router once for typed navigation.
- Use `from`, `Route.fullPath`, or `getRouteApi` for exact types.

## Minimal example

```tsx
export const router = createRouter({ routeTree, context: { queryClient } });

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}
```

```tsx
import { useParams } from '@tanstack/react-router';

const { productId } = useParams({ from: '/products/$productId' });
```
