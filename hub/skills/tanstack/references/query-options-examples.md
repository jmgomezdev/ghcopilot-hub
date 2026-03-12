# Query Options Examples

Use these examples when creating or refactoring `src/application/{feature}/{entity}.queries.ts`.

## A. Key Factories with Deterministic Identity

```typescript
import { queryOptions } from '@tanstack/react-query';

import { ProductRepository } from '@/infrastructure/product/product.repository';

export type ProductListSearch = {
  q?: string;
  category?: string;
  page: number;
  pageSize: number;
};

const normalizeSearch = (search: ProductListSearch): ProductListSearch => ({
  q: search.q?.trim() || undefined,
  category: search.category || undefined,
  page: search.page,
  pageSize: search.pageSize,
});

export const productKeys = {
  all: ['products'] as const,
  lists: () => [...productKeys.all, 'list'] as const,
  list: (storeId: string, search: ProductListSearch) =>
    [...productKeys.lists(), storeId, normalizeSearch(search)] as const,
  details: () => [...productKeys.all, 'detail'] as const,
  detail: (id: string) => [...productKeys.details(), id] as const,
};

export const productQueries = {
  list: (storeId: string, search: ProductListSearch) =>
    queryOptions({
      queryKey: productKeys.list(storeId, search),
      queryFn: () =>
        ProductRepository.getListByStore(storeId, normalizeSearch(search)),
      staleTime: 1000 * 60,
      gcTime: 1000 * 60 * 10,
    }),
  detail: (id: string) =>
    queryOptions({
      queryKey: productKeys.detail(id),
      queryFn: () => ProductRepository.getById(id),
      staleTime: 1000 * 60 * 5,
    }),
};
```

## B. Invalidation After Mutations

```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { ProductRepository } from '@/infrastructure/product/product.repository';

import { productKeys } from './product.queries';

export const useUpdateProduct = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ProductRepository.update,
    onSuccess: async (updated) => {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: productKeys.detail(updated.id),
        }),
        queryClient.invalidateQueries({ queryKey: productKeys.lists() }),
      ]);
    },
  });
};
```

## C. Key Quality Checklist

- All dynamic inputs that change data shape are included in `queryKey`.
- Avoid raw object literals built in JSX for key creation.
- Use key factories for invalidation, never hardcoded arrays in multiple files.
- Keep DTO handling in infrastructure mappers, not in query factory return types.

## D. Mutation Feedback Bridge (Layer-Safe)

Use callback injection to keep feedback UI outside Application internals.

```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query';

import { ProductRepository } from '@/infrastructure/product/product.repository';

import { productKeys } from './product.queries';

export const useUpdateProduct = (
  onErrorFeedback: (message: string) => void
) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ProductRepository.update,
    onSuccess: async (updated) => {
      await queryClient.invalidateQueries({
        queryKey: productKeys.detail(updated.id),
      });
    },
    onError: () => {
      onErrorFeedback('Failed to update product. Please retry.');
    },
  });
};
```

Guideline:

- Keep mutation feedback non-blocking and preserve form values for retry.
