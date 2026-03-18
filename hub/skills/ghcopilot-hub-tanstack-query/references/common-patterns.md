# Common TanStack Query Patterns

**Reusable patterns for real-world applications**

> Alignment note: For required route data, follow the tanstack render-as-you-fetch flow
> (Application `queryOptions` → Loader `ensureQueryData` → Presentation `useSuspenseQuery`).
> Examples below use `useQuery` for brevity and are intended for non-route or optional data.

---

## Pattern 1: Dependent Queries

```tsx
function UserPosts({ userId }) {
  const { data: user } = useQuery({
    queryKey: ["users", userId],
    queryFn: () => fetchUser(userId),
  });

  const { data: posts } = useQuery({
    queryKey: ["users", userId, "posts"],
    queryFn: () => fetchUserPosts(userId),
    enabled: !!user, // Not for useSuspenseQuery
  });
}
```

---

## Pattern 2: Parallel Queries with useQueries

```tsx
function TodoDetails({ ids }) {
  const results = useQueries({
    queries: ids.map((id) => ({
      queryKey: ["todos", id],
      queryFn: () => fetchTodo(id),
    })),
  });

  const isLoading = results.some((r) => r.isPending);
  const data = results.map((r) => r.data);
}
```

---

## Pattern 3: Paginated Queries with placeholderData

```tsx
import { keepPreviousData } from "@tanstack/react-query";

function PaginatedTodos() {
  const [page, setPage] = useState(0);

  const { data } = useQuery({
    queryKey: ["todos", page],
    queryFn: () => fetchTodos(page),
    placeholderData: keepPreviousData,
  });
}
```

---

## Pattern 4: Infinite Scroll

```tsx
function InfiniteList() {
  const { data, fetchNextPage, hasNextPage } = useInfiniteQuery({
    queryKey: ["items"],
    queryFn: ({ pageParam }) => fetchItems(pageParam),
    initialPageParam: 0,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
  });

  const ref = useRef();
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => entry.isIntersecting && hasNextPage && fetchNextPage()
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [fetchNextPage, hasNextPage]);

  return (
    <>
      {data.pages.map((page) => page.data.map((item) => <div>{item}</div>))}
      <div ref={ref}>Loading...</div>
    </>
  );
}
```

---

## Pattern 5: Optimistic Updates

```tsx
function useOptimisticToggle() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateTodo,
    onMutate: async (updated) => {
      await queryClient.cancelQueries({ queryKey: ["todos"] });
      const previous = queryClient.getQueryData(["todos"]);

      queryClient.setQueryData(["todos"], (old) =>
        old.map((todo) => (todo.id === updated.id ? updated : todo))
      );

      return { previous };
    },
    onError: (err, vars, context) => {
      queryClient.setQueryData(["todos"], context.previous);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["todos"] });
    },
  });
}
```

---

## Pattern 6: Prefetching on Hover

```tsx
function TodoList() {
  const queryClient = useQueryClient();

  const prefetch = (id) => {
    queryClient.prefetchQuery({
      queryKey: ["todos", id],
      queryFn: () => fetchTodo(id),
    });
  };

  return (
    <ul>
      {todos.map((todo) => (
        <li onMouseEnter={() => prefetch(todo.id)}>
          <Link to={`/todos/${todo.id}`}>{todo.title}</Link>
        </li>
      ))}
    </ul>
  );
}
```

> Use prefetching only for optional navigation, not required route data.

---

## Pattern 7: Search/Debounce

```tsx
import { useDeferredValue, useState } from "react";

function Search() {
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search);

  const { data } = useQuery({
    queryKey: ["search", deferredSearch],
    queryFn: ({ signal }) =>
      fetch(`/api/search?q=${deferredSearch}`, { signal }).then((r) => r.json()),
    enabled: deferredSearch.length >= 2,
  });
}
```

---

## Pattern 8: Polling/Refetch Interval

```tsx
const { data } = useQuery({
  queryKey: ["stock-price"],
  queryFn: fetchStockPrice,
  refetchInterval: 1000 * 30,
  refetchIntervalInBackground: true,
});
```

---

## Pattern 9: Conditional Fetching

```tsx
const { data } = useQuery({
  queryKey: ["user", userId],
  queryFn: () => fetchUser(userId),
  enabled: !!userId && isAuthenticated,
});
```

---

## Pattern 10: Initial Data from Cache

```tsx
const { data: todo } = useQuery({
  queryKey: ["todos", id],
  queryFn: () => fetchTodo(id),
  initialData: () => queryClient.getQueryData(["todos"])?.find((t) => t.id === id),
});
```

---

## Pattern 11: Mutation with Multiple Invalidations

```tsx
useMutation({
  mutationFn: updateTodo,
  onSuccess: (updated) => {
    queryClient.setQueryData(["todos", updated.id], updated);
    queryClient.invalidateQueries({ queryKey: ["todos"] });
    queryClient.invalidateQueries({ queryKey: ["stats"] });
    queryClient.invalidateQueries({ queryKey: ["users", updated.userId] });
  },
});
```

---

## Pattern 12: Error Boundaries with throwOnError

```tsx
useQuery({
  queryKey: ["todos"],
  queryFn: fetchTodos,
  throwOnError: true,
});
```

> For route data, prefer `throwOnError` + route error boundaries handled by the router.
