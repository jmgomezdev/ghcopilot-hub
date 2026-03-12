# Type vs. Interface

## Load Scope & Quick Navigation

Load this file when deciding modeling strategy for aliases/unions/intersections versus class/declaration-merging contracts.

Do NOT load this file for runtime performance tuning.

Prefer `type` over `interface` for type aliases, unions, intersections, branded types, and functional patterns. Use `interface` only when you absolutely need:

- Declaration merging (intentional extensibility)
- Class implementation contracts (`implements`)
- Legacy API compatibility

**❌ Incorrect: interface not preferred for use case**

```ts
interface AvatarProps {
  avatar: string;
}
```

**✅ Correct: type preferred for use case**

```ts
type AvatarProps = { avatar: string };
```
