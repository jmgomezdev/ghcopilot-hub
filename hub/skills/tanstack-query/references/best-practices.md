# TanStack Query Best Practices

**Performance, caching strategies, and common patterns**

> Alignment note: For required route data, follow the tanstack render-as-you-fetch flow
> (Application `queryOptions` → Loader `ensureQueryData` → Presentation `useSuspenseQuery`).
> Examples below use `useQuery` for brevity and are intended for non-route or optional data.

---

## 1. Avoid Request Waterfalls

### ❌ Bad: Sequential Dependencies

```tsx
function BadUserProfile({ userId }) {
  const { data: user } = useQuery({
    queryKey: ["users", userId],
    queryFn: () => fetchUser(userId),
  });

  const { data: posts } = useQuery({
    queryKey: ["posts", user?.id],
    queryFn: () => fetchPosts(user!.id),
    enabled: !!user,
  });

  const { data: comments } = useQuery({
    queryKey: ["comments", posts?.[0]?.id],
    queryFn: () => fetchComments(posts![0].id),
    enabled: !!posts && posts.length > 0,
  });
}
```

### ✅ Good: Parallel Queries

```tsx
function GoodUserProfile({ userId }) {
  const { data: user } = useQuery({
    queryKey: ["users", userId],
    queryFn: () => fetchUser(userId),
  });

  const { data: posts } = useQuery({
    queryKey: ["posts", userId],
    queryFn: () => fetchPosts(userId),
  });

  const { data: comments } = useQuery({
    queryKey: ["comments", userId],
    queryFn: () => fetchUserComments(userId),
  });
}
```

> For route data, prefetch in parallel inside the loader (e.g., `Promise.all`).

---

## 2. Query Key Strategy

### Hierarchical Structure

```tsx
["todos"][("todos", { status: "done" })][("todos", 123)];

queryClient.invalidateQueries({ queryKey: ["todos"] });
queryClient.invalidateQueries({ queryKey: ["todos", { status: "done" }] });
```

### Best Practices

```tsx
// ✅ Good: Stable, serializable keys
["users", userId, { sort: "name", filter: "active" }][
  // ❌ Bad: Functions in keys (not serializable)
  ("users", () => userId)
][
  // ❌ Bad: Changing order
  ("users", { filter: "active", sort: "name" })
];

// ✅ Good: Consistent ordering
const userFilters = { filter: "active", sort: "name" };
```

---

## 3. Caching Configuration

### staleTime vs gcTime

```tsx
// Real-time data
staleTime: 0;
// Stable data
staleTime: 1000 * 60 * 60;
// Static data
staleTime: Infinity;

// Keep frequently revisited data longer
gcTime: 1000 * 60 * 60;
```

### Per-Query vs Global

```tsx
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      gcTime: 1000 * 60 * 60,
    },
  },
});

useQuery({
  queryKey: ["stock-price"],
  queryFn: fetchStockPrice,
  staleTime: 0,
  refetchInterval: 1000 * 30,
});
```

---

## 4. Use queryOptions Factory

```tsx
export const todosQueryOptions = queryOptions({
  queryKey: ["todos"],
  queryFn: fetchTodos,
  staleTime: 1000 * 60,
});

useQuery(todosQueryOptions);
useSuspenseQuery(todosQueryOptions);
queryClient.prefetchQuery(todosQueryOptions);
```

---

## 5. Data Transformations

```tsx
function TodoCount() {
  const { data: count } = useQuery({
    queryKey: ["todos"],
    queryFn: fetchTodos,
    select: (data) => data.length,
  });
}
```

---

## 6. Prefetching (Optional Navigation)

```tsx
const prefetch = (id: number) => {
  queryClient.prefetchQuery({
    queryKey: ["todos", id],
    queryFn: () => fetchTodo(id),
    staleTime: 1000 * 60 * 5,
  });
};
```

> Do not use `prefetchQuery` for required route data; use loader `ensureQueryData` instead.

---

## 7. Optimistic Updates

```tsx
useMutation({
  mutationFn: updateTodo,
  onMutate: async (newTodo) => {
    await queryClient.cancelQueries({ queryKey: ["todos"] });
    const previous = queryClient.getQueryData(["todos"]);
    queryClient.setQueryData(["todos"], (old) => [...(old ?? []), newTodo]);
    return { previous };
  },
  onError: (err, newTodo, context) => {
    queryClient.setQueryData(["todos"], context?.previous);
  },
  onSettled: () => {
    queryClient.invalidateQueries({ queryKey: ["todos"] });
  },
});
```

---

## 8. Error Handling Strategy

```tsx
useQuery({
  queryKey: ["todos"],
  queryFn: fetchTodos,
  throwOnError: true,
});

useQuery({
  queryKey: ["todos"],
  queryFn: fetchTodos,
  throwOnError: (error) => error.status >= 500,
});
```

---

## 9. Server State vs Client State

```tsx
// ✅ Server state
const { data: todos } = useQuery({ queryKey: ["todos"], queryFn: fetchTodos });

// ✅ Client state
const [isModalOpen, setIsModalOpen] = useState(false);
```

---

## 10. Performance Monitoring

Use DevTools to:

- Verify cache hits
- Track refetch frequency
- Inspect query states
- Export cache for debugging

---

## 11. Mutation Resilience Ownership

- Mutation callbacks are valid in v5 and should be used for rollback and invalidation.
- Keep UI feedback adapters in Presentation; prefer callback injection in Application hooks.
- For complete mutation resilience patterns, see `references/resilience-and-mutations.md`.
