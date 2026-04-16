# App Router and Runtime APIs

Use this reference when the task is about route structure, file conventions, metadata, route segment config, or
version-sensitive runtime APIs.

## Choose the Right App Router Surface

| Need                                             | Prefer                     | Avoid                                  |
| ------------------------------------------------ | -------------------------- | -------------------------------------- |
| Shared shell for a subtree                       | `layout.tsx`               | Duplicating shell logic in each page   |
| Leaf route UI                                    | `page.tsx`                 | Route Handler returning UI             |
| Route-level loading fallback                     | `loading.tsx`              | Global spinner for every route         |
| Non-UI HTTP response                             | `route.ts`                 | Server Action exposed as public API    |
| Pre-render redirect, rewrite, or request shaping | `middleware.ts` in Next 15 | Pushing business logic into middleware |

## File Conventions to Reach For First

Common App Router entry points:

- `app/layout.tsx`: shared shell for a route subtree
- `app/page.tsx`: leaf page for a segment
- `app/loading.tsx`: route-segment fallback UI
- `app/error.tsx`: segment error boundary
- `app/not-found.tsx`: not found UI
- `app/api/**/route.ts`: route handlers
- Route groups like `(marketing)` affect organization, not URL structure
- Private folders like `_components` are not routable

Prefer the smallest route segment that owns the concern.

## Next.js 16 Async Request APIs

Treat these as async in new code:

- `params`
- `searchParams`
- `cookies()`
- `headers()`
- `draftMode()`

Examples:

```tsx
type Params = Promise<{ slug: string }>;

export async function generateMetadata({ params }: { params: Params }) {
  const { slug } = await params;
  return { title: slug };
}

export default async function Page({ params }: { params: Params }) {
  const { slug } = await params;
  return <h1>{slug}</h1>;
}
```

```tsx
import { headers } from "next/headers";

export default async function Page() {
  const headerStore = await headers();
  const userAgent = headerStore.get("user-agent");

  return <pre>{userAgent}</pre>;
}
```

Temporary sync migration escapes exist, but do not recommend them as the target pattern.

## `use client` Boundary Rules

Use `use client` only at the leaf that needs client capability.

- Marking a high-level layout or page as client pulls its imports into the client graph
- Keep static shells, navigation, and data loading on the server when possible
- Wrap client-only third-party components in a small Client Component adapter

NEVER mark a layout or page as client just because one nested widget needs interactivity. Extract the widget instead.

This reference decides boundary placement only. Once the leaf is client-side, load `ghcopilot-hub-react` for hook,
effect, ref, and event-handler patterns.

## Metadata and Dynamic Data

Prefer deterministic metadata when possible.

When `generateMetadata()` needs route params or request-time data:

- Await async `params`
- Keep the work minimal
- Avoid broad dynamic dependencies when only a small field is needed

If metadata or viewport generation touches dynamic runtime data, it may alter how much of the route can be included in
the static shell.

## Route Segment Config

Route handlers, pages, and layouts can use segment config such as:

- `dynamic`
- `dynamicParams`
- `revalidate`
- `fetchCache`
- `runtime`
- `preferredRegion`

Prefer explicit config only when a default is not sufficient. Do not scatter config across many nested files without a
clear reason.

When Cache Components is enabled, route segment config values such as `dynamic`, `revalidate`, and `fetchCache` should generally be treated as migration-era controls. Prefer `use cache` and `cacheLife()` instead of introducing new segment-level caching config.

## Route Typing with `RouteContext`

For typed route handlers, prefer `RouteContext` when the route literal is known.

```ts
export async function GET(_req: Request, ctx: RouteContext<"/users/[id]">) {
  const { id } = await ctx.params;
  return Response.json({ id });
}
```

This is especially useful in TypeScript-heavy codebases because it localizes route param expectations.

## Middleware vs Proxy Naming

This area is version-sensitive:

- Next.js 16 repos commonly still use `middleware.ts`
- Newer documentation renames the same concept to `proxy.ts`

Guidance for Next 15 work:

- Preserve `middleware.ts` unless the task is explicitly about migration
- Explain the naming mismatch when users compare examples from newer docs
- Use this feature only when logic must run before rendering, redirecting, rewriting, or header mutation

Do not recommend it for ordinary data access or mutation logic that belongs in Server Components, Server Actions, or
Route Handlers.

## Anti-Patterns

- NEVER move metadata, data fetching, and mutation rules into middleware to "centralize" them. This usually harms
  clarity and testability.
- NEVER recommend synchronous `params`/`searchParams` as the preferred Next 15 pattern. That is migration guidance,
  not the steady-state recommendation.
- NEVER add route segment config reactively without naming the behavior change it causes.

## Runtime API Checklist

Before changing route runtime behavior, verify:

1. Does this logic truly need request-time access?
2. Can it live in a Server Component instead?
3. Can it be expressed with route segment config instead of an edge interception layer?
4. Is the version-specific file convention correct for this repo?
