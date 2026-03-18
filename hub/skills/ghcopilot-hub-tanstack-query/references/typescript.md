# TypeScript Patterns for TanStack Query

**Type-safe query and mutation patterns**

> Alignment note: define `queryOptions` in the Application layer and reuse them in Presentation.

---

## 1. Basic Type Inference

```tsx
type Todo = {
  id: number;
  title: string;
  completed: boolean;
};

const { data } = useQuery({
  queryKey: ["todos"],
  queryFn: async (): Promise<Todo[]> => {
    const response = await fetch("/api/todos");
    return response.json();
  },
});
```

---

## 2. Generic Query Hook

```tsx
function useEntity<T>(endpoint: string, id: number) {
  return useQuery({
    queryKey: [endpoint, id],
    queryFn: async (): Promise<T> => {
      const response = await fetch(`/api/${endpoint}/${id}`);
      return response.json();
    },
  });
}
```

---

## 3. queryOptions with Type Safety

```tsx
export const todosQueryOptions = queryOptions({
  queryKey: ["todos"],
  queryFn: async (): Promise<Todo[]> => {
    const response = await fetch("/api/todos");
    return response.json();
  },
  staleTime: 1000 * 60,
});

useQuery(todosQueryOptions);
useSuspenseQuery(todosQueryOptions);
queryClient.prefetchQuery(todosQueryOptions);
```

---

## 4. Mutation with Types

```tsx
type CreateTodoInput = { title: string };

type CreateTodoResponse = Todo;

const { mutate } = useMutation<CreateTodoResponse, Error, CreateTodoInput, { previous?: Todo[] }>({
  mutationFn: async (input) => {
    const response = await fetch("/api/todos", {
      method: "POST",
      body: JSON.stringify(input),
    });
    return response.json();
  },
});
```

---

## 5. Custom Error Types

```tsx
class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public code: string
  ) {
    super(message);
  }
}

const { error } = useQuery<Todo[], ApiError>({
  queryKey: ["todos"],
  queryFn: async () => {
    const response = await fetch("/api/todos");
    if (!response.ok) {
      throw new ApiError("Failed to fetch", response.status, "FETCH_ERROR");
    }
    return response.json();
  },
});
```

---

## 6. Zod Schema Validation

```tsx
import { z } from "zod";

const TodoSchema = z.object({
  id: z.number(),
  title: z.string(),
  completed: z.boolean(),
});

type Todo = z.infer<typeof TodoSchema>;

const { data } = useQuery({
  queryKey: ["todos"],
  queryFn: async () => {
    const response = await fetch("/api/todos");
    const json = await response.json();
    return TodoSchema.array().parse(json);
  },
});
```

---

## 7. Type-Safe Query Keys

```tsx
const queryKeys = {
  todos: {
    all: ["todos"] as const,
    lists: () => [...queryKeys.todos.all, "list"] as const,
    list: (filters: TodoFilters) => [...queryKeys.todos.lists(), filters] as const,
    details: () => [...queryKeys.todos.all, "detail"] as const,
    detail: (id: number) => [...queryKeys.todos.details(), id] as const,
  },
};

useQuery({
  queryKey: queryKeys.todos.detail(1),
  queryFn: () => fetchTodo(1),
});
```

---

## 8. Strict Null Checks

```tsx
const { data } = useQuery({
  queryKey: ["todo", id],
  queryFn: () => fetchTodo(id),
});

const title = data?.title ?? "No title";
```

---

## Best Practices

✅ Always type `queryFn` return values
✅ Use `as const` for query keys
✅ Prefer `queryOptions` for reuse
✅ Use Zod for runtime + compile-time validation
✅ Keep strict null checks enabled
