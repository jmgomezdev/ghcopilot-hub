# React Compiler

React 19 includes React Compiler (formerly React Forget), which automatically optimizes re-renders.

## Load Scope & Quick Navigation

Load this file when the user asks about memoization, render performance, removing `useMemo`/`useCallback`/`React.memo`, or compiler verification.

Do NOT load this file when the task is primarily about effect dependencies, cleanup/reconnection bugs, or compound component architecture.

Quick navigation:

- Need to decide if compiler advice applies? → [Mandatory Verification Gate](#mandatory-verification-gate)
- Need compiler behavior model? → [What the Compiler Does](#what-the-compiler-does)
- Need exceptions/fallbacks? → [When Manual Optimization Might Still Help](#when-manual-optimization-might-still-help)
- Need activation checks? → [Verifying Compiler Is Working](#verifying-compiler-is-working)

## Mandatory Verification Gate

Do not recommend removing manual `useMemo`, `useCallback`, or `React.memo` unless compiler activation is verified.

Verification checklist:

1. Project uses a React 19 compiler-compatible setup.
2. Team/tooling confirms compiler is enabled for this project.
3. Performance decision is validated with profiler evidence in the target flow.

If any check fails:

- Keep existing manual memoization in place.
- Prefer local/per-component optimization decisions instead of global rewrites.

## What the Compiler Does

The compiler automatically:

- Memoizes component renders (like `React.memo`)
- Memoizes expensive computations (like `useMemo`)
- Memoizes callback functions (like `useCallback`)
- Optimizes JSX element creation

```tsx
// You write this:
function ProductCard({ product, onAddToCart }: ProductCardProps) {
  const formattedPrice = formatPrice(product.price);

  const handleClick = () => {
    onAddToCart(product.id);
  };

  return (
    <div onClick={handleClick}>
      <h2>{product.name}</h2>
      <p>{formattedPrice}</p>
    </div>
  );
}

// Compiler automatically transforms to something like:
function ProductCard({ product, onAddToCart }: ProductCardProps) {
  const formattedPrice = useMemo(() => formatPrice(product.price), [product.price]);

  const handleClick = useCallback(() => {
    onAddToCart(product.id);
  }, [onAddToCart, product.id]);

  return useMemo(
    () => (
      <div onClick={handleClick}>
        <h2>{product.name}</h2>
        <p>{formattedPrice}</p>
      </div>
    ),
    [handleClick, product.name, formattedPrice]
  );
}
```

---

## What You Should NOT Do

With React Compiler, these patterns are **unnecessary**:

```tsx
// ❌ UNNECESSARY: Manual useMemo
const sortedItems = useMemo(() => items.toSorted((a, b) => a.name.localeCompare(b.name)), [items]);

// ✅ JUST WRITE: Compiler handles it
const sortedItems = items.toSorted((a, b) => a.name.localeCompare(b.name));
```

```tsx
// ❌ UNNECESSARY: Manual useCallback
const handleSubmit = useCallback(
  (data: FormData) => {
    submitForm(data);
  },
  [submitForm]
);

// ✅ JUST WRITE: Compiler handles it
const handleSubmit = (data: FormData) => {
  submitForm(data);
};
```

```tsx
// ❌ UNNECESSARY: React.memo wrapper
const ProductCard = memo(function ProductCard({ product }: Props) {
  return <div>{product.name}</div>;
});

// ✅ JUST WRITE: Compiler handles it
function ProductCard({ product }: Props) {
  return <div>{product.name}</div>;
}
```

---

## Rules of React (Still Apply)

The compiler relies on you following the Rules of React. Violations break optimization.

### 1. Components Must Be Pure

```tsx
// ❌ BREAKS COMPILER: Side effect during render
function Counter() {
  globalCounter++; // Mutation!
  return <div>{globalCounter}</div>;
}

// ✅ WORKS: Pure render
function Counter({ count }: { count: number }) {
  return <div>{count}</div>;
}
```

### 2. Props and State Are Immutable

```tsx
// ❌ BREAKS COMPILER: Mutating props
function List({ items }: { items: Item[] }) {
  items.sort(); // Mutates prop!
  return (
    <ul>
      {items.map((item) => (
        <li key={item.id}>{item.name}</li>
      ))}
    </ul>
  );
}

// ✅ WORKS: Create new array
function List({ items }: { items: Item[] }) {
  const sortedItems = items.toSorted((a, b) => a.name.localeCompare(b.name));
  return (
    <ul>
      {sortedItems.map((item) => (
        <li key={item.id}>{item.name}</li>
      ))}
    </ul>
  );
}
```

### 3. Return Values and Arguments Are Immutable

```tsx
// ❌ BREAKS COMPILER: Mutating returned value
function useItems() {
  const items = useSuspenseQuery(itemQueries.list());
  items.data.push(newItem); // Mutating query result!
  return items;
}

// ✅ WORKS: Treat as immutable
function useItems() {
  const items = useSuspenseQuery(itemQueries.list());
  // To add: use mutation, not direct modification
  return items;
}
```

### 4. Don't Mutate After JSX Creation

```tsx
// ❌ BREAKS COMPILER: Mutating after using in JSX
function Component({ items }: { items: Item[] }) {
  const listItems = items.map((item) => <li key={item.id}>{item.name}</li>);
  items.push(newItem); // Mutation after JSX uses items!
  return <ul>{listItems}</ul>;
}
```

---

## When Manual Optimization Might Still Help

In rare cases, you may still want manual control:

### 1. Opting Out of Memoization

If you need a fresh callback reference every render:

```tsx
// Force new reference (rare use case)
function Form({ onSubmit }: { onSubmit: () => void }) {
  // eslint-disable-next-line react-compiler/react-compiler
  const handleSubmit = () => {
    onSubmit();
  };

  return <form onSubmit={handleSubmit}>...</form>;
}
```

### 2. Very Expensive Computations with External Libraries

If computation involves external libraries the compiler can't analyze:

```tsx
import { expensiveExternalComputation } from "some-library";

function Chart({ data }: { data: DataPoint[] }) {
  // Compiler may not optimize external library calls correctly
  // In rare cases, manual useMemo might help
  const processedData = useMemo(() => expensiveExternalComputation(data), [data]);

  return <ChartRenderer data={processedData} />;
}
```

### 3. Debugging Performance Issues

If you suspect the compiler isn't optimizing correctly, use React DevTools Profiler to verify, then file an issue with the React team.

---

## Verifying Compiler Is Working

Check that compilation is active:

```tsx
// In development, check the component in React DevTools
// Components optimized by the compiler show a "Memo ✓" badge

// Or check the compiled output in browser devtools
// Look for `useMemo` and `useCallback` calls added by compiler
```

If you cannot verify activation in the current codebase, do not apply compiler-only simplifications.

---

## Summary

| Before React 19                    | With React Compiler        |
| ---------------------------------- | -------------------------- |
| `useMemo(() => compute(), [deps])` | `compute()`                |
| `useCallback(() => fn(), [deps])`  | `() => fn()`               |
| `React.memo(Component)`            | `Component`                |
| Manual dependency arrays           | Automatic                  |
| Performance tuning                 | Just follow Rules of React |

**Focus on writing correct, readable code. Let the compiler handle optimization.**
