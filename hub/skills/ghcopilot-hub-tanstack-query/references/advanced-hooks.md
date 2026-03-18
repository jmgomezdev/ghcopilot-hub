# Advanced TanStack Query Patterns (v5)

> These practices **complement** the tanstack skill. They do not replace or contradict its rules.

## useMutationState — Global mutation tracking

Access mutation state from any component without prop drilling:

```tsx
import { useMutationState } from "@tanstack/react-query";

function GlobalLoadingIndicator() {
  const pendingMutations = useMutationState({
    filters: { status: "pending" },
    select: (mutation) => mutation.state.variables,
  });

  if (pendingMutations.length === 0) return null;
  return <div>Saving {pendingMutations.length} items...</div>;
}

// Filter by mutationKey
const todoMutations = useMutationState({
  filters: { mutationKey: ["addTodo"] },
});
```

### Typing note

Due to fuzzy inference, `mutation.state.variables` can be `unknown`. See issue #14 in the ghcopilot-hub-tanstack-query SKILL.md.

## Network Mode — Offline/PWA support

Control behavior when offline:

```tsx
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      networkMode: "offlineFirst",
    },
  },
});

useQuery({
  queryKey: ["todos"],
  queryFn: fetchTodos,
  networkMode: "always",
});
```

| Mode               | Behavior                                    |
| ------------------ | ------------------------------------------- |
| `online` (default) | Only fetches when online                    |
| `always`           | Always tries (local APIs or service worker) |
| `offlineFirst`     | Uses cache first, fetches when back online  |

**Paused state detection:**

```tsx
const { isPending, fetchStatus } = useQuery(...)
// isPending + fetchStatus === 'paused' = offline, waiting for network
```

## useQueries with combine

Combine results from parallel queries (use for optional/secondary data, not required route data):

```tsx
const results = useQueries({
  queries: userIds.map((id) => ({
    queryKey: ['user', id],
    queryFn: () => fetchUser(id),
  })),
  combine: (results) => ({
    data: results.map((r) => r.data),
    pending: results.some((r) => r.isPending),
    error: results.find((r) => r.error)?.error,
  }),
});

if (results.pending) return <Loading />;
console.log(results.data);

> For required route data, keep the tanstack render-as-you-fetch flow: Application `queryOptions` → Loader `ensureQueryData` → Presentation `useSuspenseQuery`.
```

## infiniteQueryOptions helper

Typed factory for infinite queries (parallel to queryOptions):

```tsx
import {
  infiniteQueryOptions,
  prefetchInfiniteQuery,
  useInfiniteQuery,
} from "@tanstack/react-query";

const todosInfiniteOptions = infiniteQueryOptions({
  queryKey: ["todos", "infinite"],
  queryFn: ({ pageParam }) => fetchTodosPage(pageParam),
  initialPageParam: 0,
  getNextPageParam: (lastPage) => lastPage.nextCursor,
});

useInfiniteQuery(todosInfiniteOptions);
useSuspenseInfiniteQuery(todosInfiniteOptions);
prefetchInfiniteQuery(queryClient, todosInfiniteOptions);
```

## maxPages — Memory optimization

Limit cached pages for infinite queries:

```tsx
useInfiniteQuery({
  queryKey: ["posts"],
  queryFn: ({ pageParam }) => fetchPosts(pageParam),
  initialPageParam: 0,
  getNextPageParam: (lastPage) => lastPage.nextCursor,
  getPreviousPageParam: (firstPage) => firstPage.prevCursor,
  maxPages: 3,
});
```

**Rule:** `maxPages` requires bi-directional pagination.
