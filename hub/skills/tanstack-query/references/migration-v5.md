# TanStack Query v4 → v5 Migration Guide

**Migration checklist for upgrading from React Query v4 to TanStack Query v5**

---

## Breaking Changes Summary

### 1. Object Syntax Required

```tsx
useQuery({
  queryKey: ['todos'],
  queryFn: fetchTodos,
  staleTime: 5000,
});
```

### 2. Query Callbacks Removed

```tsx
const { data } = useQuery({ queryKey: ['todos'], queryFn: fetchTodos });
useEffect(() => {
  if (data) console.log(data);
}, [data]);
```

### 3. `isLoading` → `isPending`

```tsx
const { isPending } = useQuery({ queryKey: ['todos'], queryFn: fetchTodos });
```

### 4. `cacheTime` → `gcTime`

```tsx
gcTime: 1000 * 60 * 60;
```

### 5. `initialPageParam` Required for Infinite Queries

```tsx
useInfiniteQuery({
  queryKey: ['projects'],
  queryFn: ({ pageParam }) => fetchProjects(pageParam),
  initialPageParam: 0,
  getNextPageParam: (lastPage) => lastPage.nextCursor,
});
```

### 6. `keepPreviousData` → `placeholderData`

```tsx
import { keepPreviousData } from '@tanstack/react-query';

useQuery({
  queryKey: ['todos', page],
  queryFn: () => fetchTodos(page),
  placeholderData: keepPreviousData,
});
```

### 7. `useErrorBoundary` → `throwOnError`

```tsx
useQuery({
  queryKey: ['todos'],
  queryFn: fetchTodos,
  throwOnError: true,
});
```

---

## Step-by-Step Migration

1. Update dependencies to the latest TanStack Query v5.
2. Replace function overloads with object syntax.
3. Replace query callbacks with `useEffect` or move to mutations.
4. Replace `isLoading` with `isPending`.
5. Replace `cacheTime` with `gcTime`.
6. Add `initialPageParam` to infinite queries.
7. Replace `keepPreviousData` with `placeholderData`.
8. Update error boundaries with `throwOnError`.

---

## Common Migration Issues

- Callbacks not firing → use `useEffect`.
- `isLoading` always false → use `isPending`.
- `cacheTime` not recognized → use `gcTime`.
- Infinite query type error → add `initialPageParam`.
