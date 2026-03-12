# Top TanStack Query Errors & Solutions

**Complete error reference with fixes**

---

## Error #1: Object Syntax Required

**Why**: v5 removed function overloads; only object syntax works.

**Fix**:

```tsx
useQuery({ queryKey: ['todos'], queryFn: fetchTodos });
```

---

## Error #2: Query Callbacks Not Working

**Why**: `onSuccess`, `onError`, `onSettled` removed from queries (still work in mutations).

**Fix**:

```tsx
const { data } = useQuery({ queryKey: ['todos'], queryFn: fetchTodos });
useEffect(() => {
  if (data) console.log(data);
}, [data]);
```

---

## Error #3: isLoading Always False

**Why**: v5 changed `isLoading` meaning; use `isPending` for initial load.

**Fix**:

```tsx
const { isPending } = useQuery({ queryKey: ['todos'], queryFn: fetchTodos });
```

---

## Error #4: cacheTime Not Recognized

**Why**: Renamed to `gcTime`.

**Fix**:

```tsx
gcTime: 1000 * 60 * 60;
```

---

## Error #5: useSuspenseQuery + enabled

**Why**: `enabled` not available with Suspense.

**Fix**:

```tsx
{
  id ? <TodoComponent id={id} /> : <div>No ID</div>;
}
```

---

## Error #6: initialPageParam Required

**Why**: v5 requires explicit `initialPageParam` for infinite queries.

**Fix**:

```tsx
useInfiniteQuery({
  queryKey: ['projects'],
  queryFn: ({ pageParam }) => fetchProjects(pageParam),
  initialPageParam: 0,
  getNextPageParam: (lastPage) => lastPage.nextCursor,
});
```

---

## Error #7: keepPreviousData Not Working

**Why**: replaced by `placeholderData`.

**Fix**:

```tsx
import { keepPreviousData } from '@tanstack/react-query';

useQuery({
  queryKey: ['todos', page],
  queryFn: () => fetchTodos(page),
  placeholderData: keepPreviousData,
});
```

---

## Error #8: Error Type Mismatch

**Why**: v5 defaults to `Error` instead of `unknown`.

**Fix**:

```tsx
const { error } = useQuery<DataType, string>({
  queryKey: ['data'],
  queryFn: async () => {
    if (fail) throw 'custom error';
    return data;
  },
});
```

---

## Error #9: invalidateQueries Doesn’t Refetch Inactive

**Why**: `invalidateQueries` only refetches active queries by default.

**Fix**:

```tsx
queryClient.invalidateQueries({
  queryKey: ['todos'],
  refetchType: 'all',
});
```

---

## Quick Diagnosis Checklist

- [ ] Object syntax in all hooks?
- [ ] `isPending` for initial loading?
- [ ] `gcTime` instead of `cacheTime`?
- [ ] No query callbacks (`onSuccess`, etc.)?
- [ ] `initialPageParam` for infinite queries?
- [ ] Query keys are arrays?
- [ ] Errors thrown in `queryFn`?
