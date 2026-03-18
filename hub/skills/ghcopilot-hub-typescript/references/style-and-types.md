# TypeScript Style & Typing Notes

## Load Scope & Quick Navigation

Load this file for naming conventions, `satisfies` vs `as const`, baseline utility types, type guards, and `import type` usage.

Do NOT load this file for branch/loop performance diagnostics when dedicated perf references are required.

Quick navigation:

- Naming/casing guidance → [Naming Conventions (Casing)](#naming-conventions-casing)
- `as const` vs `satisfies` tradeoffs → [as const vs satisfies](#as-const-vs-satisfies)
- Utility types cheat sheet → [Utility Types](#utility-types)
- Type guards baseline → [Type Guards](#type-guards)
- Type-only imports → [Import Types](#import-types)

## Naming Conventions (Casing)

Use a single, consistent casing strategy by context. Avoid mixing styles in the same scope unless required by external systems.

### Recommended Usage

- **camelCase**: variables, functions, methods, local state, parameters.
- **PascalCase**: types, interfaces, classes, React components.
- **kebab-case**: URLs, route segments, file names for static assets.
- **snake_case**: avoid in TS/JS; only for external APIs or database schemas.

### Examples

```ts
// camelCase
const userId = "123";
function getUserById(id: string) {}

// PascalCase
type UserId = string;
interface UserProfile {}
class UserService {}

// kebab-case (URLs)
// /user-profile/123

// snake_case (external APIs / DB fields)
interface UserApiResponse {
  user_id: string;
  created_at: string;
}
```

### Interop Guidance

When consuming snake_case data from APIs, map to camelCase at the boundary (infrastructure layer) so the rest of the app remains consistent.

---

## `as const` vs `satisfies`

### Summary

- **`as const`**: narrows literals and makes values deeply readonly.
- **`satisfies`**: validates the shape while preserving the most specific inferred type.
- **Combine both** when you need immutability **and** validation.

### Practical Differences

```ts
interface Theme {
  colors: Record<string, string>;
  spacing: Record<string, number>;
}

// ✅ Validate shape + keep exact keys
const theme = {
  colors: { primary: "#3b82f6", secondary: "#10b981" },
  spacing: { sm: 8, md: 16, lg: 24 },
} satisfies Theme;

// ✅ Immutable + validated
const themeConst = {
  colors: { primary: "#3b82f6", secondary: "#10b981" },
  spacing: { sm: 8, md: 16, lg: 24 },
} as const satisfies Theme;

// ⚠️ `as const` only (no validation)
const themeOnlyConst = {
  colors: { primary_typo: "#3b82f6" },
  spacing: { sm: 8 },
} as const;
```

### Common Pitfall

Avoid `const x: Type = ...` for config objects because the type annotation widens literals and erases exact keys. Prefer `satisfies` so typos are caught at compile time while keeping precise inference.

---

## Avoid TypeScript `enum`

### Why

- Adds runtime artifacts and non-idiomatic JS behavior.
- Creates tight coupling to enum members instead of values.
- Reduces flexibility when interoperating with plain strings.

### Preferred Alternatives

#### 1) Const object + derived union (recommended)

```ts
const ROLE = {
  ADMIN: "ADMIN",
  USER: "USER",
  GUEST: "GUEST",
} as const;

type Role = (typeof ROLE)[keyof typeof ROLE];

function setRole(role: Role) {}

setRole(ROLE.ADMIN);
setRole("ADMIN");
```

#### 2) Literal union (small sets)

```ts
type Size = "sm" | "md" | "lg";
```

### Avoid

```ts
enum RoleEnum {
  ADMIN = "ADMIN",
  USER = "USER",
  GUEST = "GUEST",
}
```

---

## Utility Types

```ts
Pick<User, "id" | "name">; // Select fields
Omit<User, "id">; // Exclude fields
Partial<User>; // All optional
Required<User>; // All required
Readonly<User>; // All readonly
Record<string, User>; // Object type
Extract<Union, "a" | "b">; // Extract from union
Exclude<Union, "a">; // Exclude from union
NonNullable<T | null>; // Remove null/undefined
ReturnType<typeof fn>; // Function return type
Parameters<typeof fn>; // Function params tuple
```

## Type Guards

```ts
function isUser(value: unknown): value is User {
  return typeof value === "object" && value !== null && "id" in value && "name" in value;
}
```

## Import Types

```ts
import type { User } from "./types";
import { type Config, createUser } from "./utils";
```
