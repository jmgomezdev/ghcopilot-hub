# Streaming, Serialization, and Hydration

Use this reference when the task is about loading states, Suspense, `loading.tsx`, promise handoff to clients, or
hydration-safe rendering.

## Failure Router

| Symptom                                 | Likely cause                            | First fix                                                   |
| --------------------------------------- | --------------------------------------- | ----------------------------------------------------------- |
| `loading.tsx` never appears             | Dynamic work in layout                  | Move dynamic read deeper or add local Suspense              |
| Hydration warning after mount           | Server and client initial render differ | Make first render deterministic                             |
| Client component receives too much data | Over-broad server payload               | Send a thin view model                                      |
| Whole route waits for one slow query    | Missing boundary                        | Wrap slow subtree in `<Suspense>`                           |
| Browser API usage breaks SSR            | Client logic started on server          | Move it to a client leaf; React skill owns the internal fix |

## Prefer Route-Local Streaming Boundaries

There are two main streaming tools:

- `loading.tsx` for route-segment level fallback UI
- `<Suspense>` for fine-grained subtrees

Use `loading.tsx` when the whole segment should show an immediate fallback on navigation.

Use local `<Suspense>` when only part of the page is slow or request-time.

## Why `loading.tsx` Sometimes Does Not Appear

If a layout reads uncached or request-time data, that layout can block navigation before the segment fallback is shown.

Common causes:

- `await cookies()` in a layout
- `await headers()` in a layout
- uncached fetches high in the tree

Fixes:

- move the dynamic read deeper into the page
- wrap the dynamic subtree in `<Suspense>`
- keep layouts as static as possible

## Promise Streaming to Client Components

When a client island needs server-fetched data, do not automatically convert the whole route to a Client Component.

A strong pattern is:

1. start the async work in a Server Component
2. pass the Promise down
3. resolve it in a Client Component with `use()` inside a Suspense boundary

```tsx
import { Suspense } from "react";
import ClientPosts from "./client-posts";

export default function Page() {
  const postsPromise = getPosts();

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ClientPosts postsPromise={postsPromise} />
    </Suspense>
  );
}
```

```tsx
"use client";

import { use } from "react";

export default function ClientPosts({
  postsPromise,
}: {
  postsPromise: Promise<Array<{ id: string; title: string }>>;
}) {
  const posts = use(postsPromise);
  return (
    <ul>
      {posts.map((post) => (
        <li key={post.id}>{post.title}</li>
      ))}
    </ul>
  );
}
```

This reference covers the RSC handoff shape, not generic client hook architecture. Once data reaches the client leaf,
delegate state/effect patterns to `ghcopilot-hub-react`.

## Serialization Rules

Props crossing the server-to-client boundary must be serializable by React.

Prefer:

- thin view models
- IDs plus display fields
- normalized data slices
- promise handoff when it avoids giant payloads

Avoid:

- rich ORM records with methods
- non-serializable classes
- huge nested object graphs
- passing full session/user objects when only a few fields are rendered

## Hydration-Safe Rendering

Hydration mismatches in Next.js usually happen when the prerendered shell and the first client render disagree across
the RSC boundary.

Common causes:

- reading `window` or `localStorage` during initial render
- rendering `Date.now()` or random values without isolating them
- branching on browser-only conditions before hydration completes

Prefer these patterns:

- render a stable server-compatible fallback first
- move browser-only logic into a client leaf and let `ghcopilot-hub-react` own the hook/effect implementation there
- isolate request-time or browser-only content behind Suspense or a client boundary

Use `suppressHydrationWarning` only for truly unavoidable one-off content mismatches, not as a default fix.

NEVER use `suppressHydrationWarning` as the primary solution when the mismatch is caused by avoidable render logic.

## Keep the Static Shell Useful

The best App Router UX is usually:

- static shell for navigation and stable content
- streamed fallback for dynamic content
- small client islands for interactivity

Avoid forcing the whole root layout to request time unless the route truly requires it.

## Non-Deterministic Values

Values like `Math.random()`, `Date.now()`, and `crypto.randomUUID()` require deliberate handling.

- If they should be per-request, keep them in request-time code and isolate them behind Suspense when needed
- If they should be shared until invalidation, cache them explicitly

Do not let non-deterministic values leak into the static shell accidentally.

## Anti-Patterns

- NEVER move an entire route to the client just to solve one hydration mismatch.
- NEVER pass server-only modules, clients, or privileged handles to Client Components.
- NEVER put request-time reads in the root layout unless you intentionally want to widen the dynamic surface.
- NEVER use this reference as the source of truth for generic `useEffect` or event-handler fixes; that belongs to `ghcopilot-hub-react`.
