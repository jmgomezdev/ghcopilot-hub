# Common React Mistakes

Frequent errors and their fixes.

## Quick Navigation

| Symptom                          | Section                                                                                                                                     |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| Renders `0` unexpectedly         | [Conditional Rendering with &&](#conditional-rendering-with-)                                                                               |
| Ref misuse during render         | [Reading/Writing Refs During Render](#readingwriting-refs-during-render)                                                                    |
| Impossible state combinations    | [Impossible States](#impossible-states)                                                                                                     |
| Redundant / poorly shaped state  | [State Principles](#state-principles)                                                                                                       |
| Hook naming / lifecycle wrappers | [Custom Hooks](#custom-hooks)                                                                                                               |
| Derived/reset logic in effects   | [Effects for Derived State](#effects-for-derived-state) and [Effects to Reset State on Prop Change](#effects-to-reset-state-on-prop-change) |

## Conditional Rendering with &&

Using a number on the left side of `&&` can render "0" instead of nothing.

```tsx
// ❌ BUG: Renders "0" when array is empty
function UserList({ users }: { users: User[] }) {
  return <div>{users.length && users.map((user) => <UserCard key={user.id} user={user} />)}</div>;
}
// When users.length is 0, React renders the number 0
```

```tsx
// ✅ FIX: Use explicit comparison
function UserList({ users }: { users: User[] }) {
  return (
    <div>{users.length > 0 && users.map((user) => <UserCard key={user.id} user={user} />)}</div>
  );
}
```

```tsx
// ✅ ALSO VALID: Ternary operator
function UserList({ users }: { users: User[] }) {
  return (
    <div>
      {users.length > 0 ? (
        users.map((user) => <UserCard key={user.id} user={user} />)
      ) : (
        <EmptyState message="No users found" />
      )}
    </div>
  );
}
```

**Rule**: Never use values that could be `0`, `""`, `NaN` on the left of `&&`.

---

## Reading/Writing Refs During Render

Refs are mutable and accessing them during render breaks React's rendering model.

```tsx
// ❌ BUG: Writing ref during render
function Counter() {
  const renderCount = useRef(0);
  renderCount.current += 1; // Side effect during render!

  return <div>Rendered {renderCount.current} times</div>;
}
```

```tsx
// ✅ FIX: Use state for render-related values
function Counter() {
  const [renderCount, setRenderCount] = useState(0);

  useEffect(() => {
    setRenderCount((prev) => prev + 1);
  }, []);

  return <div>Rendered {renderCount} times</div>;
}
```

```tsx
// ✅ FIX: Use refs only in effects/handlers
function VideoPlayer({ src }: { src: string }) {
  const videoRef = useRef<HTMLVideoElement>(null);

  // ❌ NEVER: Read during render
  // const isPlaying = !videoRef.current?.paused;

  // ✅ Read in event handler
  const handleToggle = () => {
    if (videoRef.current?.paused) {
      videoRef.current.play();
    } else {
      videoRef.current?.pause();
    }
  };

  return <video ref={videoRef} src={src} />;
}
```

---

## State Updates Based on Previous State

Always use the functional update form when new state depends on previous state.

```tsx
// ❌ BUG: May use stale state in rapid updates
function Counter() {
  const [count, setCount] = useState(0);

  const handleClick = () => {
    setCount(count + 1);
    setCount(count + 1); // Both use same stale `count`
    // Result: count increases by 1, not 2
  };
}
```

```tsx
// ✅ FIX: Use functional updates
function Counter() {
  const [count, setCount] = useState(0);

  const handleClick = () => {
    setCount((prev) => prev + 1);
    setCount((prev) => prev + 1); // Uses updated value
    // Result: count increases by 2
  };
}
```

---

## Impossible States

Multiple booleans can represent invalid combinations. Prefer a single status union.

```tsx
// ❌ BUG: Impossible combinations are representable
function SearchInput() {
  const [isTyping, setIsTyping] = useState(false);
  const [isEmpty, setIsEmpty] = useState(true);
  // isTyping=true and isEmpty=true can happen
}

// ✅ FIX: Single status source of truth
type InputStatus = "empty" | "typing" | "submitted";

function SearchInput() {
  const [status, setStatus] = useState<InputStatus>("empty");

  const isEmpty = status === "empty";
  const isTyping = status === "typing";
}
```

Same strategy applies to async flows:

```tsx
type FetchStatus = "idle" | "pending" | "success" | "error";

function useAsyncData() {
  const [status, setStatus] = useState<FetchStatus>("idle");

  const isLoading = status === "idle" || status === "pending";
  const isSuccess = status === "success";
  const isError = status === "error";
}
```

---

## State Principles

### Group Related State

```tsx
// ❌ BUG: Separate state that changes together
const [x, setX] = useState(0);
const [y, setY] = useState(0);

// ✅ FIX: Group in one object
const [position, setPosition] = useState({ x: 0, y: 0 });
```

### Avoid Redundant State

```tsx
// ❌ BUG: Derived value duplicated in state
const [firstName, setFirstName] = useState("");
const [lastName, setLastName] = useState("");
const [fullName, setFullName] = useState("");

// ✅ FIX: Derive during render
const fullName = `${firstName} ${lastName}`;
```

### Reset with `key`

```tsx
function App() {
  const [formKey, setFormKey] = useState(0);
  const resetForm = () => setFormKey((prev) => prev + 1);

  return <Form key={formKey} />;
}
```

### Colocate State

```tsx
// ❌ BUG: State too high, unrelated subtree re-renders
function App() {
  const [firstName, setFirstName] = useState("");
  return (
    <>
      <input value={firstName} onChange={(e) => setFirstName(e.target.value)} />
      <PageContent />
    </>
  );
}

// ✅ FIX: Move state to the leaf that owns it
function App() {
  return (
    <>
      <SignupForm />
      <PageContent />
    </>
  );
}
```

---

## Mutating State Directly

React only re-renders when state reference changes. Mutating objects/arrays doesn't trigger updates.

```tsx
// ❌ BUG: Mutating array doesn't trigger re-render
function TodoList() {
  const [todos, setTodos] = useState<Todo[]>([]);

  const addTodo = (todo: Todo) => {
    todos.push(todo); // Mutation!
    setTodos(todos); // Same reference, no re-render
  };
}
```

```tsx
// ✅ FIX: Create new reference
function TodoList() {
  const [todos, setTodos] = useState<Todo[]>([]);

  const addTodo = (todo: Todo) => {
    setTodos((prev) => [...prev, todo]); // New array
  };

  const updateTodo = (id: string, updates: Partial<Todo>) => {
    setTodos((prev) => prev.map((todo) => (todo.id === id ? { ...todo, ...updates } : todo)));
  };

  const removeTodo = (id: string) => {
    setTodos((prev) => prev.filter((todo) => todo.id !== id));
  };
}
```

---

## Missing Key or Using Index as Key

Keys help React identify which items changed. Bad keys cause bugs and performance issues.

```tsx
// ❌ BUG: Using index as key with reorderable/filterable lists
{
  todos.map((todo, index) => <TodoItem key={index} todo={todo} />);
}
// Problem: Reordering shuffles state between components
```

```tsx
// ❌ BUG: Missing key
{
  todos.map((todo) => (
    <TodoItem todo={todo} /> // Warning: Each child should have a unique "key"
  ));
}
```

```tsx
// ✅ FIX: Use stable, unique identifier
{
  todos.map((todo) => <TodoItem key={todo.id} todo={todo} />);
}
```

**When index as key is OK**:

- Static lists that never reorder
- Items have no state
- List is never filtered

---

## Custom Hooks

### Hooks Share Logic, Not State

Each hook call has isolated state.

```tsx
function StatusBar() {
  const isOnline = useOnlineStatus();
}

function SaveButton() {
  const isOnline = useOnlineStatus();
}
```

### Name `useXxx` Only If It Uses Hooks

```tsx
// ❌ BUG: Misleading name, no hooks inside
function useSorted(items: string[]) {
  return items.slice().sort();
}

// ✅ FIX: plain utility name
function getSorted(items: string[]) {
  return items.slice().sort();
}

// ✅ Valid useXxx
function useAuth() {
  return useContext(AuthContext);
}
```

### Avoid Lifecycle Wrapper Hooks

```tsx
// ❌ BUG: Hides dependencies from linter
function useMount(fn: () => void) {
  useEffect(() => {
    fn();
  }, []);
}

// ✅ FIX: Keep dependency checks explicit at call site
useEffect(() => {
  doSomething();
}, [doSomething]);
```

---

## Effects for Derived State

Don't use Effects to compute values that can be calculated during render.

```tsx
// ❌ BUG: Effect for derived state
const [firstName, setFirstName] = useState("Taylor");
const [lastName, setLastName] = useState("Swift");
const [fullName, setFullName] = useState("");

useEffect(() => {
  setFullName(firstName + " " + lastName);
}, [firstName, lastName]);

// ✅ FIX: Calculate during render
const [firstName, setFirstName] = useState("Taylor");
const [lastName, setLastName] = useState("Swift");
const fullName = firstName + " " + lastName;
```

---

## Effects to Reset State on Prop Change

Don't use Effects to reset state when props change. Use the `key` prop.

```tsx
// ❌ BUG: Effect to reset state
function ProfilePage({ userId }: { userId: string }) {
  const [comment, setComment] = useState("");

  useEffect(() => {
    setComment("");
  }, [userId]);
  // ...
}

// ✅ FIX: Use key to reset component state
function ProfilePage({ userId }: { userId: string }) {
  return <Profile userId={userId} key={userId} />;
}

function Profile({ userId }: { userId: string }) {
  const [comment, setComment] = useState(""); // Resets automatically
  // ...
}
```

---

## useEffect for Data Fetching

Don't use `useEffect` as the default data-fetching tool in components.

- SPA / client-only runtime: use TanStack Query with loaders.
- Next.js App Router / RSC runtime: fetch on the server first, then pass data into client leaves.
- Only use `useEffect` for fetching when you are already inside a client boundary and the fetch truly must happen after mount.

```tsx
// ❌ ANTI-PATTERN: useEffect for data fetching
function ProductList() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProducts().then((data) => {
      setProducts(data);
      setLoading(false);
    });
  }, []);

  if (loading) return <Skeleton />;
  return <List products={products} />;
}
```

```tsx
// ✅ PATTERN: Use TanStack Query with Suspense (per project architecture)
// 1. Define query in application layer
// application/product/product.queries.ts
export const productQueries = {
  list: () =>
    queryOptions({
      queryKey: ["products"],
      queryFn: () => productRepository.getAll(),
    }),
};

// 2. Load in router loader
// interface/router/routes/product/productList.route.tsx
export const productListRoute = createRoute({
  path: "/products",
  loader: () => queryClient.ensureQueryData(productQueries.list()),
  component: ProductListPage,
});

// 3. Consume with Suspense query
// presentation/product/ProductList.page.tsx
function ProductListPage() {
  const { data: products } = useSuspenseQuery(productQueries.list());
  return <ProductList products={products} />;
}
```

---

## Overusing Context

Don't use React Context for frequently changing values. It re-renders all consumers.

```tsx
// ❌ PERFORMANCE ISSUE: Context for frequently changing state
const MousePositionContext = createContext({ x: 0, y: 0 });

function App() {
  const [position, setPosition] = useState({ x: 0, y: 0 });

  return (
    <MousePositionContext.Provider value={position}>
      {/* ALL consumers re-render on every mouse move */}
      <div onMouseMove={(e) => setPosition({ x: e.clientX, y: e.clientY })}>
        <Header />
        <Content />
        <Footer />
      </div>
    </MousePositionContext.Provider>
  );
}
```

```tsx
// ✅ FIX: Use Zustand for frequently changing client state
// application/shared/store/mouse.store.ts
export const useMouseStore = create<MouseState>()((set) => ({
  position: { x: 0, y: 0 },
  setPosition: (x: number, y: number) => set({ position: { x, y } }),
}));

// Components subscribe to specific slices
function Cursor() {
  const position = useMouseStore((state) => state.position);
  return <div style={{ left: position.x, top: position.y }} />;
}
```

**Use Context for**:

- Themes
- Locale/i18n
- Auth state (rarely changes)
- Feature flags

**Use Zustand for**:

- Frequently updating values
- Complex client state
- State shared across many components
