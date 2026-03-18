---
name: ghcopilot-hub-react
description: >
  React 19 patterns with Compiler-aware guidance, composition, refs, and effects. Trigger: When working with React
  components (.tsx, .jsx), effects, refs, context APIs, or render performance/memoization decisions.
license: Apache-2.0
metadata:
  author: jmgomezdev
  version: "1.0"
---

# React 19 + Compiler Patterns

This skill is optimized for React 19 projects and prioritizes decision quality over cookbook snippets.

## Activation Gates (MANDATORY)

Before applying recommendations, choose the path below.

| User task                                                        | Load                                                                                    | Do NOT load                                              |
| ---------------------------------------------------------------- | --------------------------------------------------------------------------------------- | -------------------------------------------------------- |
| Performance/memoization (`useMemo`, `useCallback`, `React.memo`) | **MANDATORY**: [references/react-compiler.md](references/react-compiler.md)             | `common-mistakes.md` unless user also asks basics        |
| Effect dependencies, cleanup, reconnection bugs                  | **MANDATORY**: [references/effects-patterns.md](references/effects-patterns.md)         | `react-compiler.md` unless also perf-related             |
| Compound components / provider architecture                      | **MANDATORY**: [references/composition-patterns.md](references/composition-patterns.md) | `react-compiler.md`, `effects-patterns.md` unless needed |
| React basics / common pitfalls                                   | [references/common-mistakes.md](references/common-mistakes.md)                          | Advanced references unless requested                     |

If the required reference is not loaded, do not give prescriptive advice for that area.

## Symptom Router (Fast Path)

| Symptom / user ask                             | Go to                                                                                        |
| ---------------------------------------------- | -------------------------------------------------------------------------------------------- |
| "Can I remove useMemo/useCallback/React.memo?" | [references/react-compiler.md](references/react-compiler.md) → Mandatory Verification Gate   |
| "Effect keeps reconnecting / rerunning"        | [references/effects-patterns.md](references/effects-patterns.md) → Effect Dependencies       |
| "Need non-reactive logic in Effect"            | [references/effects-patterns.md](references/effects-patterns.md) → useEffectEvent + fallback |
| "Too many boolean props / variant explosion"   | [references/composition-patterns.md](references/composition-patterns.md)                     |
| "Basic React pitfall"                          | [references/common-mistakes.md](references/common-mistakes.md)                               |

## Pair with TypeScript

When working with React, always load both this skill and `ghcopilot-hub-typescript` together. TypeScript patterns (type-first
development, discriminated unions, Zod validation) apply to React code.

## React Compiler

**Impact: CRITICAL**

Compiler guidance is valid only when compiler activation is verified.

Requires:

- Project is on React 19 compiler-compatible setup
- Compiler is enabled/active (see [references/react-compiler.md](references/react-compiler.md))

Fallback if not verified:

- Keep existing manual `useMemo` / `useCallback` / `React.memo`
- Prefer targeted profiling before removing memoization

Use plain code by default only after verification gate passes. For full before/after examples and edge cases, read
[references/react-compiler.md](references/react-compiler.md).

See [references/react-compiler.md](references/react-compiler.md) for verification and edge cases.

---

## React 19 API Changes

**Impact: MEDIUM**

Apply these recommendations only when the project runtime/toolchain supports them. If support is uncertain, use the
fallback and avoid forced migration advice.

### ref as Regular Prop (No forwardRef)

Requires React 19-compatible setup.

Fallback:

- If project is on React 18, keep `forwardRef`.

```tsx
// Legacy-compatible: forwardRef wrapper (React 18 pattern)
const ComposerInput = forwardRef<HTMLInputElement, Props>((props, ref) => {
  return <input ref={ref} {...props} />;
});

// Preferred in React 19-capable setups: ref as regular prop
function ComposerInput({ ref, ...props }: Props & { ref?: React.Ref<HTMLInputElement> }) {
  return <input ref={ref} {...props} />;
}
```

### use() Instead of useContext()

Use with caution and only when project tooling/runtime fully supports this pattern.

Fallback:

- `useContext(MyContext)` is valid and preferred for compatibility-sensitive codebases.

```tsx
// Compatible baseline: useContext
const value = useContext(MyContext);

// Preferred when runtime/tooling supports it: use()
const value = use(MyContext);
```

---

## State & Composition Baselines

Keep baseline React guidance in references to preserve context budget.

- Impossible states, state principles, custom hooks, and conditional rendering pitfalls:
  [references/common-mistakes.md](references/common-mistakes.md)
- Compound components and provider patterns:
  [references/composition-patterns.md](references/composition-patterns.md)

---

## Refs & Effects Rules

**Impact: CRITICAL**

### Core Principle: Effects Are Escape Hatches

Effects let you "step outside" React to synchronize with external systems. **Most component logic should NOT use
Effects.** Before writing an Effect, ask: "Is there a way to do this without an Effect?"

### When to Use Effects

Effects are for synchronizing with **external systems**:

- Subscribing to browser APIs (WebSocket, IntersectionObserver, resize)
- Connecting to third-party libraries not written in React
- Setting up/cleaning up event listeners on window/document
- Controlling non-React DOM elements (video players, maps)

### When NOT to Use Effects

```tsx
// ❌ NEVER: Derived state in Effect
useEffect(() => {
  setFullName(firstName + " " + lastName);
}, [firstName, lastName]);

// ✅ ALWAYS: Calculate during render
const fullName = firstName + " " + lastName;
```

```tsx
// ❌ NEVER: Reset state in Effect
useEffect(() => {
  setComment("");
}, [userId]);

// ✅ ALWAYS: Use key to reset
<Profile userId={userId} key={userId} />;
```

```tsx
// ❌ NEVER: Event-specific logic in Effect
useEffect(() => {
  if (product.isInCart) {
    showNotification("Added to cart");
  }
}, [product]);

// ✅ ALWAYS: Logic in event handler
function handleAddToCart() {
  addToCart(product);
  showNotification("Added to cart");
}
```

See [references/effects-patterns.md](references/effects-patterns.md) for advanced patterns and `useEffectEvent`
fallbacks.

### Don't Read/Write Refs During Render

```tsx
// ❌ NEVER: Read/write ref.current during render
function MyComponent() {
  const myRef = useRef(null);
  myRef.current = 123; // Writing during render!

  return <h1>{myOtherRef.current}</h1>; // Reading during render!
}

// ✅ ALWAYS: Use refs in effects or event handlers
function MyComponent() {
  const myRef = useRef<number | null>(null);

  useEffect(() => {
    myRef.current = 123; // Effect - OK
  }, []);

  const handleClick = () => {
    console.log(myRef.current); // Event handler - OK
  };
}
```

### Additional baseline rules

For custom hooks naming, lifecycle anti-patterns, and conditional rendering basics, load
[references/common-mistakes.md](references/common-mistakes.md).

---

## Decision Tree

When deciding how to implement logic:

1. **Need to respond to user interaction?** → Use event handler
2. **Need computed value from props/state?** → Calculate during render
3. **Need to reset state on prop change?** → Use `key` prop
4. **Need to synchronize with external system?** → Use Effect with cleanup
5. **Need mutable value that doesn't trigger render?** → Use ref
6. **Need perf advice around memoization?** → Load `react-compiler.md` first, verify compiler, then decide
7. **Need non-reactive logic inside Effect?** → Load `effects-patterns.md`, prefer fallback-safe approach if
   `useEffectEvent` is unavailable

---

## Resources

| Task                          | Mandatory reference                                                      | Do NOT load                                           |
| ----------------------------- | ------------------------------------------------------------------------ | ----------------------------------------------------- |
| Memoization/performance       | [references/react-compiler.md](references/react-compiler.md)             | `common-mistakes.md`                                  |
| Effects/dependency bugs       | [references/effects-patterns.md](references/effects-patterns.md)         | `react-compiler.md` unless perf is requested          |
| Provider/compound composition | [references/composition-patterns.md](references/composition-patterns.md) | `effects-patterns.md` unless effect logic is involved |
| Basics/pitfalls               | [references/common-mistakes.md](references/common-mistakes.md)           | Advanced references unless explicitly needed          |
