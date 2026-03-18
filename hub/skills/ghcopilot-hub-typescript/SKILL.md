---
name: ghcopilot-hub-typescript
description: >
  Advanced TypeScript decision patterns for strict typing: satisfies vs type annotations, exhaustiveness checks,
  const-derived unions, and performance-aware control/data flow. Trigger: Use when the task involves TypeScript
  modeling decisions (type vs interface, enum alternatives), strict mode/type errors, generics, utility types, or
  hot-path performance issues in branching/looping.
license: Apache-2.0
metadata:
  author: jmgomezdev
  version: "1.0"
---

## Decision Tree

```
Defining a config object?            → Use `satisfies ConfigType` to keep autocomplete
Writing a switch on a Union?         → Use `default: satisfies never`
Validating a fixed Record keys?      → Use `satisfies Record<Key, Value>`
Need generic type validation?        → Use Type Annotation (`: Type`)

```

## Activation Gates (MANDATORY)

Before giving prescriptive advice, load only the required reference.

| User task / symptom                                               | Mandatory reference                                                                        | Do NOT load                            |
| ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------ | -------------------------------------- |
| Naming, `satisfies`, `as const`, import/type guard basics         | [references/style-and-types.md](references/style-and-types.md)                             | Perf references unless requested       |
| Hot path perf (`async` overhead, closures, regex/concat in loops) | [references/perf-additional-concerns.md](references/perf-additional-concerns.md)           | Branching/looping refs unless needed   |
| Cache locality / predictable execution                            | [references/perf-execution-cache-locality.md](references/perf-execution-cache-locality.md) | Branching reference unless needed      |
| Nested if/switch complexity                                       | [references/reduce-branching.md](references/reduce-branching.md)                           | Cache-locality reference unless needed |
| Multi-pass array pipelines / lookup complexity                    | [references/reduce-looping.md](references/reduce-looping.md)                               | Branching reference unless needed      |
| `type` vs `interface` decision                                    | [references/type-vs-interface.md](references/type-vs-interface.md)                         | Perf references                        |

If the mandatory reference is not loaded, avoid hard recommendations for that area.

## Symptom Router (Fast Path)

| Symptom / question                        | Go to                                                                                                      |
| ----------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| "Should I use `satisfies` or `: Type`?"   | [Critical Patterns](#critical-patterns) + [references/style-and-types.md](references/style-and-types.md)   |
| "Can I use `enum` here?"                  | [No `enum` (REQUIRED)](#no-enum-required) + [references/style-and-types.md](references/style-and-types.md) |
| "This function is slow on hot path"       | [references/perf-additional-concerns.md](references/perf-additional-concerns.md)                           |
| "Too many loops/filter-map-reduce passes" | [references/reduce-looping.md](references/reduce-looping.md)                                               |
| "Too many nested conditionals"            | [references/reduce-branching.md](references/reduce-branching.md)                                           |
| "Type or interface?"                      | [references/type-vs-interface.md](references/type-vs-interface.md)                                         |

## Naming Conventions (Casing)

Use the canonical casing guide in:

- [references/style-and-types.md](references/style-and-types.md)

## Critical Patterns

### `satisfies` over Type Annotation

**Impact: HIGH**

Prefer the `satisfies` operator over explicit type annotation (`: Type`) when defining variables. Type annotation
"widens" the type to the general definition (losing specific literals), while `satisfies` validates the structure
but infers the most specific type possible.

```typescript
type Config = { mode: "simple" | "advanced"; debug?: boolean };

// ❌ Bad: Type Annotation (Widening)
// 'config.mode' becomes "simple" | "advanced". We lose the specific value "simple".
const config: Config = { mode: "simple" };

// ✅ Good: Satisfies (Preserves Literal)
// 'config.mode' is inferred as literal "simple", but validated against Config.
const config = { mode: "simple" } satisfies Config;
```

### `as const` vs `satisfies`

**Impact: HIGH**

Use `satisfies` to validate shape without widening; use `as const` to freeze and narrow literals. Combine both when
you need immutability **and** validation.

Reference: [references/style-and-types.md](references/style-and-types.md)

### Exhaustiveness Checking (`never`)

**Impact: CRITICAL**

Use `satisfies never` in the `default` case of a `switch` statement to ensure all members of a Union type are
handled. This throws a build-time error if a new case is added to the Union but not the switch.

```typescript
type Grade = "A" | "B" | "C";

function getFeedback(grade: Grade) {
  switch (grade) {
    case "A":
      return "Excellent";
    case "B":
      return "Good";
    case "C":
      return "Average";
    default:
      // ✅ Build-time error if 'D' is added to Grade type but not handled here
      const _exhaustiveCheck: never = grade;
      return _exhaustiveCheck;
  }
}
```

---

### Const Types Pattern (REQUIRED)

```typescript
// ✅ ALWAYS: Create const object first, then extract type
const STATUS = {
  ACTIVE: "active",
  INACTIVE: "inactive",
  PENDING: "pending",
} as const;

type Status = (typeof STATUS)[keyof typeof STATUS];

// ❌ NEVER: Direct union types
type Status = "active" | "inactive" | "pending";
```

**Why?** Single source of truth, runtime values, autocomplete, easier refactoring.

### No `enum` (REQUIRED)

**Impact: HIGH**

Avoid TypeScript `enum`. Prefer const objects with derived unions or small literal unions.

Exception:

- Keep existing enums when interop/contracts/tooling require enum runtime semantics.

Reference: [references/style-and-types.md](references/style-and-types.md)

### Flat Interfaces (REQUIRED)

```typescript
// ✅ ALWAYS: One level depth, nested objects → dedicated interface
interface UserAddress {
  street: string;
  city: string;
}

interface User {
  id: string;
  name: string;
  address: UserAddress; // Reference, not inline
}

interface Admin extends User {
  permissions: string[];
}

// ❌ NEVER: Inline nested objects
interface User {
  address: { street: string; city: string }; // NO!
}
```

Exception:

- Nested structures are acceptable when they model stable domain boundaries and improve readability.

### Never Use `any`

```typescript
// ✅ Use unknown for truly unknown types
function parse(input: unknown): User {
  if (isUser(input)) return input;
  throw new Error("Invalid input");
}

// ✅ Use generics for flexible types
function first<T>(arr: T[]): T | undefined {
  return arr[0];
}

// ❌ NEVER
function parse(input: any): any {}
```

Exception:

- Boundary adapters may use temporary `any` with immediate narrowing and no propagation.

## Baseline TS Constructs

Utility types, type guards, and import type patterns are preserved in:

- [references/style-and-types.md](references/style-and-types.md)

## Performance & Execution

Prioritize patterns that reduce overhead and improve cache locality:

- Avoid concatenations and regex creation in hot loops.
- Avoid `async` wrappers without `await` and `try/catch` inside loops.
- Minimize closures that capture large scopes.
- Prefer sequential access and data structures with better locality.

References:

- [references/perf-additional-concerns.md](references/perf-additional-concerns.md)
- [references/perf-execution-cache-locality.md](references/perf-execution-cache-locality.md)
- [references/style-and-types.md](references/style-and-types.md)

## Control Flow & Data Processing

Reduce branching and multiple passes over collections on critical paths.

References:

- [references/reduce-branching.md](references/reduce-branching.md)
- [references/reduce-looping.md](references/reduce-looping.md)

## Type vs. Interface

Prefer `type` for aliases/unions/intersections and use `interface` only when you need merging or class contracts.

Reference:

- [references/type-vs-interface.md](references/type-vs-interface.md)
