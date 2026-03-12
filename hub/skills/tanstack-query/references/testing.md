# Testing TanStack Query

**Testing queries, mutations, and components**

> Alignment note: for route data, test loaders with `ensureQueryData` and render pages with `useSuspenseQuery`.

---

## Test Utils

```tsx
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render } from "@testing-library/react";

export function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: Infinity,
      },
    },
    logger: {
      log: console.log,
      warn: console.warn,
      error: () => {},
    },
  });
}

export function renderWithClient(ui: React.ReactElement) {
  const testQueryClient = createTestQueryClient();
  return render(<QueryClientProvider client={testQueryClient}>{ui}</QueryClientProvider>);
}
```

---

## Testing Queries

```tsx
import { renderHook, waitFor } from "@testing-library/react";

describe("useTodos", () => {
  it("fetches todos successfully", async () => {
    const { result } = renderHook(() => useTodos(), {
      wrapper: ({ children }) => (
        <QueryClientProvider client={createTestQueryClient()}>{children}</QueryClientProvider>
      ),
    });

    expect(result.current.isPending).toBe(true);
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
  });
});
```

---

## Testing with MSW

```tsx
import { HttpResponse, http } from "msw";
import { setupServer } from "msw/node";

const server = setupServer(
  http.get("/api/todos", () => {
    return HttpResponse.json([{ id: 1, title: "Test todo", completed: false }]);
  })
);
```

---

## Testing Mutations

```tsx
test("adds todo successfully", async () => {
  const { result } = renderHook(() => useAddTodo());

  act(() => {
    result.current.mutate({ title: "New todo" });
  });

  await waitFor(() => expect(result.current.isSuccess).toBe(true));
});
```

---

## Testing Components with Suspense

```tsx
import { Suspense } from "react";

render(
  <QueryClientProvider client={createTestQueryClient()}>
    <Suspense fallback={null}>
      <TodoList />
    </Suspense>
  </QueryClientProvider>
);
```

---

## Best Practices

✅ Disable retries in tests
✅ Use MSW for consistent mocking
✅ Test loading, success, and error states
✅ Test optimistic updates and rollbacks
✅ Use `waitFor` for async updates
✅ Prefill cache when testing with existing data
❌ Don't test implementation details
❌ Don't mock TanStack Query internals
