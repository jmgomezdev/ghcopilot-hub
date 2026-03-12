# Resilience and mutations

Use this reference for robust mutation flows, rollback behavior, and user-facing feedback without breaking layer boundaries.

## Rules

- Query callbacks are removed in v5 queries, but mutation callbacks remain valid.
- Prefer optimistic updates with rollback for latency-sensitive UX.
- Keep feedback ownership in Presentation adapters; Application hooks should use callback injection or expose state.
- Preserve user-entered values on mutation failure for retry.

## Pattern A: optimistic update + rollback

```tsx
useMutation({
  mutationFn: updateTodo,
  onMutate: async (nextTodo) => {
    await queryClient.cancelQueries({ queryKey: ['todos'] });
    const previous = queryClient.getQueryData(['todos']);
    queryClient.setQueryData(['todos'], (old: Todo[] = []) =>
      old.map((todo) => (todo.id === nextTodo.id ? nextTodo : todo))
    );
    return { previous };
  },
  onError: (_error, _vars, context) => {
    queryClient.setQueryData(['todos'], context?.previous);
  },
  onSettled: () => {
    queryClient.invalidateQueries({ queryKey: ['todos'] });
  },
});
```

## Pattern B: layer-safe feedback bridge

```typescript
export const useUpdateProduct = (
  onErrorFeedback: (message: string) => void
) => {
  return useMutation({
    mutationFn: ProductRepository.update,
    onError: () => {
      onErrorFeedback('Failed to update product. Please retry.');
    },
  });
};
```

## Pattern C: throwOnError strategy for reads

```tsx
useQuery({
  queryKey: ['products'],
  queryFn: fetchProducts,
  throwOnError: (error) => error.status >= 500,
});
```

Use route boundaries for route-critical reads and local handling for optional/background reads.

## Pitfalls

- Treating query callback removal as mutation callback removal.
- Resetting forms on mutation error and losing user state.
- Importing UI toast adapters directly in Application hooks.
