# Search params

## Rules

- Always validate with `validateSearch` and Zod.
- Defaults should live in the schema via `.catch`.

## Minimal example

```tsx
import { z } from "zod";

const searchSchema = z.object({
  page: z.number().min(1).catch(1),
  q: z.string().optional(),
});

export const listRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/products",
  validateSearch: (search) => searchSchema.parse(search),
  component: ProductListPage,
});

export function ProductListPage() {
  const { page, q } = listRoute.useSearch();
  return <ProductList page={page} query={q} />;
}
```
