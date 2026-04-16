---
name: ghcopilot-hub-next-16
description: "Next.js 16 App Router patterns for Server Components, Server Actions, route handlers, caching, streaming, and version-sensitive request APIs. Trigger: Use when working in Next.js 16 App Router code with app/, layout.tsx, page.tsx, loading.tsx, generateMetadata, Server Actions, route.ts handlers, revalidatePath/revalidateTag, cookies()/headers()/params async APIs, middleware.ts vs proxy.ts naming, or RSC streaming and serialization issues."
license: Apache-2.0
metadata:
  author: jmgomezdev
  version: "1.0"
---

# Next.js 16 App Router Patterns

This skill focuses on Next.js 16 runtime and App Router decisions.

Keep React hook, ref, effect, composition, and compiler advice in `ghcopilot-hub-react`. Keep type-modeling and
TypeScript performance advice in `ghcopilot-hub-typescript`.

## Pair with React & TypeScript

When working in a Next.js 16 codebase, load these skills together when relevant:

- `ghcopilot-hub-react` for Client Component internals: hooks, effects, refs, event logic, composition, and render behavior after a client boundary already exists.
- `ghcopilot-hub-typescript` for route typing, async props typing, schema boundaries, and config modeling.

This skill decides whether a Next.js client boundary should exist and how data crosses it. The React skill decides how the
client code inside that boundary should be structured.

## When to Use

- Building or refactoring routes under `app/`
- Deciding whether a route segment needs a Next.js client boundary
- Implementing Server Actions, route handlers, metadata, or runtime APIs
- Fixing waterfalls, cache misses, or over-broad `use client`
- Handling `params`, `searchParams`, `cookies()`, or `headers()` in Next.js 16
- Designing streaming boundaries, loading states, or RSC-safe payloads
- Migrating or reviewing Next.js 16 App Router code with version-sensitive behavior

## Activation Gates (MANDATORY)

Before giving prescriptive advice, load the required reference for the user's task.

| User task / symptom                                                                                           | Mandatory reference                                                                                                  | Do NOT load                                                  |
| ------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------ |
| File conventions, `layout.tsx`, metadata, route groups, route segment config, middleware or proxy naming      | [references/app-router-and-runtime-apis.md](references/app-router-and-runtime-apis.md)                               | Caching and streaming refs unless needed                     |
| Slow routes, sequential awaits, fetch defaults, `use cache`, `React.cache`, `revalidatePath`, `revalidateTag` | [references/data-fetching-waterfalls-and-cache.md](references/data-fetching-waterfalls-and-cache.md)                 | Security ref unless mutation-related                         |
| Server Actions, auth/authz in mutations, route handlers, webhooks, CORS, external callbacks                   | [references/server-actions-route-handlers-and-security.md](references/server-actions-route-handlers-and-security.md) | Streaming ref unless payload or hydration is involved        |
| `loading.tsx`, Suspense, promise streaming to clients, hydration mismatches, serialization limits             | [references/streaming-serialization-and-hydration.md](references/streaming-serialization-and-hydration.md)           | App Router reference unless file conventions are also needed |

If the mandatory reference is not loaded, avoid hard recommendations for that area.

## Symptom Router (Fast Path)

| Symptom / question                                             | Go to                                                                                                                                                                                                                       |
| -------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| "Should this be a Server Component or `use client`?"           | Critical Patterns + [references/app-router-and-runtime-apis.md](references/app-router-and-runtime-apis.md)                                                                                                                  |
| "Why is this route slow?"                                      | [references/data-fetching-waterfalls-and-cache.md](references/data-fetching-waterfalls-and-cache.md)                                                                                                                        |
| "Why did Next 15 break my params or headers usage?"            | [references/app-router-and-runtime-apis.md](references/app-router-and-runtime-apis.md)                                                                                                                                      |
| "Should this mutation be a Server Action or a route handler?"  | [references/server-actions-route-handlers-and-security.md](references/server-actions-route-handlers-and-security.md)                                                                                                        |
| "How do I revalidate after a mutation?"                        | [references/data-fetching-waterfalls-and-cache.md](references/data-fetching-waterfalls-and-cache.md) + [references/server-actions-route-handlers-and-security.md](references/server-actions-route-handlers-and-security.md) |
| "Why is `loading.tsx` not showing?"                            | [references/streaming-serialization-and-hydration.md](references/streaming-serialization-and-hydration.md)                                                                                                                  |
| "Can I pass this object/function/class to a Client Component?" | [references/streaming-serialization-and-hydration.md](references/streaming-serialization-and-hydration.md)                                                                                                                  |
| "Should I use middleware here?"                                | [references/app-router-and-runtime-apis.md](references/app-router-and-runtime-apis.md) + [references/server-actions-route-handlers-and-security.md](references/server-actions-route-handlers-and-security.md)               |

## Decision Tree

```text
Need a Next.js client boundary for a leaf?              -> Client Component with 'use client'; React skill owns the internals inside it
Need data fetching, secrets, or server-only libraries?  -> Server Component
Need to mutate from form or client interaction?         -> Server Action
Need webhook, public endpoint, CORS, or non-UI output?  -> Route Handler
Need route-level auth/redirect/rewrite before render?   -> middleware.ts in Next 15, or proxy.ts only when migrating newer conventions
Need fresh per-request data?                            -> Uncached fetch or runtime API + Suspense boundary
Need reusable cached data?                              -> Explicit caching strategy, then revalidation plan
Need to stream slow content?                            -> loading.tsx or local Suspense boundary
Need data in Client Component?                          -> Pass minimal serializable props or stream a Promise
```

## Preflight Questions

Before changing architecture, ask these in order:

1. Is this truly a client concern, or is `use client` being used to escape a server-side decision?
2. Is the route slow because of network shape, or because of sequential `await` order?
3. Is the code relying on old caching defaults that changed in Next.js 16?
4. Does this need a Server Action, or does it actually need explicit HTTP semantics from a Route Handler?
5. Is a runtime API being read too high in the tree, preventing `loading.tsx` or static shell behavior?
6. Is the data crossing the RSC boundary smaller and more serializable than it needs to be?

If these questions are not answered first, recommendations often drift toward overusing `use client`, middleware, or
ad hoc caching.

## Critical Patterns

### Server Components First

**Impact: CRITICAL**

Pages and layouts in the App Router are Server Components by default. Prefer server rendering unless the code needs
client-only capabilities.

Use Server Components for:

- Data fetching close to the source
- Secrets, database access, and server-only dependencies
- Large static UI shells with minimal client JavaScript
- Passing already-prepared serializable data to small client islands

Use a Client Component boundary only when a leaf truly requires client-only capability.

Typical boundary triggers are:

- Browser-only APIs
- User interaction that cannot stay server-driven
- Client-only third-party widgets

`'use client'` creates a client module boundary. Everything imported below that boundary joins the client bundle.

This skill does not define hook, effect, ref, or composition patterns inside that client subtree. Load
`ghcopilot-hub-react` for those decisions.

### Treat Next.js 16 Request APIs as Async

**Impact: CRITICAL**

In Next.js 16, request-time APIs are async-first. Default guidance:

- `await cookies()`
- `await headers()`
- `await draftMode()`
- `await params`
- `await searchParams`

Do not give synchronous examples as the preferred approach. Temporary sync escapes exist for migration, but they are not
the target pattern for new code.

### Assume Uncached by Default, Then Opt In Deliberately

**Impact: CRITICAL**

In Next.js 16:

- `fetch()` is not cached by default
- `GET` Route Handlers are not cached by default

Do not assume old App Router caching defaults. For Next.js 16 guidance, recommend `use cache` and `cacheLife()` when Cache Components is enabled.

When Cache Components is enabled, treat older caching controls such as `dynamic`, `revalidate`, and `fetchCache` as migration targets to remove, not patterns to introduce.

Always pair caching advice with an invalidation plan.

### Remove Waterfalls Before Micro-Optimizing

**Impact: CRITICAL**

Within a single async component, sequential `await` calls still create waterfalls.

- Start independent requests before awaiting them
- Use `Promise.all()` or `Promise.allSettled()` when appropriate
- Split slow uncached work behind Suspense boundaries
- Use `React.cache()` only for per-request deduplication, not cross-request persistence

If the second query depends on the first query's result, keep it sequential but stream around it when possible.

### Server Actions Are Public POST Entry Points

**Impact: CRITICAL**

Server Actions are reachable through network requests, not only through rendered forms. Always validate:

- Authentication
- Authorization
- Input shape
- Resource ownership or policy checks

Do not rely on route guards or middleware alone to secure a Server Action.

If the mutation needs webhook-style access, explicit HTTP method handling, or non-UI consumers, prefer a Route Handler.

### Pick the Right Mutation Surface

**Impact: HIGH**

Use Server Actions for:

- Form submissions
- UI-triggered mutations tied to a route tree
- Mutations that should return updated UI in the same roundtrip

Use Route Handlers for:

- Webhooks
- Public API endpoints
- CORS-managed endpoints
- File, XML, RSS, or streaming responses
- Integrations called by third parties or other services

### Revalidate Before Redirecting

**Impact: HIGH**

`redirect()` throws a framework-handled control-flow exception. Any code after it will not run.

If a mutation should both refresh cached data and navigate, call `revalidatePath()`, `revalidateTag()`, or `updateTag()`
before `redirect()`.

### Keep Client Payloads Small and Serializable

**Impact: HIGH**

Props passed from Server Components to Client Components must be serializable by React.

Prefer:

- Plain objects, arrays, strings, numbers, booleans, and nullables
- Minimal slices of data instead of full ORM entities
- Promise streaming plus `use()` when that simplifies client handoff

Avoid passing:

- Database clients
- Class instances with behavior
- Large nested data graphs when a small view model is enough
- Server-only functions unless explicitly using Server Actions as props

### Protect Server-Only Modules

**Impact: HIGH**

Shared modules can accidentally cross the server/client boundary. Mark sensitive server modules with `server-only` when
they include secrets, server-only libraries, or privileged logic.

### Metadata and Runtime APIs Have Their Own Cost Model

**Impact: MEDIUM**

`generateMetadata()` and related runtime APIs can access dynamic data, but they can also pull a route away from static
work if used carelessly. Prefer simple, deterministic metadata where possible, and load the App Router reference before
changing metadata behavior.

### Middleware Naming Is Version-Sensitive

**Impact: MEDIUM**

Next.js 16 codebases commonly still use `middleware.ts`. Newer documentation renames this convention to `proxy.ts`.

- Preserve `middleware.ts` in explicit Next 15 work unless the user is migrating conventions
- Explain the rename when the user copies examples from newer docs
- Treat this feature as a last resort, not a default extension point

## NEVER Defaults

### NEVER Add `use client` to a Page or Layout Just to Make Code "Work"

Why: this often hides the real issue, expands the client bundle, and throws away the App Router's server-first model.

Fix the root cause instead:

- move browser-only logic into a client leaf
- keep data loading on the server
- stream data or pass serializable props down

Then load `ghcopilot-hub-react` for the internal client implementation.

### NEVER Secure Server Actions with Middleware Alone

Why: action calls are network-reachable POST requests and route coverage can change during refactors or matcher edits.

Always re-check auth, authz, and resource ownership inside the action itself.

### NEVER Assume Next.js Still Uses the Old Caching Defaults

Why: in Next.js 16, wrong assumptions produce stale-data bugs and misleading advice.

Check whether the project is using:

- uncached default fetches
- `use cache` as the primary caching model
- legacy fetch-level cache controls only when Cache Components is not in use
- route handler config
- Cache Components and related cache APIs

### NEVER Read Runtime APIs High in the Tree If You Expect `loading.tsx` to Cover It

Why: `cookies()`, `headers()`, and other request-time reads in layouts can block navigation before the fallback is
shown.

Push those reads deeper or isolate them behind `<Suspense>`.

### NEVER Pass Rich Server Objects Across the RSC Boundary

Why: ORM entities, class instances, or oversized session objects create serialization pressure and hydration risk.

Send a thin view model instead.

### NEVER Reach for Middleware as a General Business-Logic Layer

Why: it is the wrong place for most data access, mutation, and authorization rules. Prefer Server Components, Server
Actions, and Route Handlers unless the need is truly pre-render request shaping.

## Code Examples

```tsx
// Server Component by default
export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await getPost(slug);

  return <LikeButton likes={post.likes} />;
}
```

```tsx
// Start independent work before awaiting
export default async function Dashboard({ params }: { params: Promise<{ team: string }> }) {
  const { team } = await params;
  const statsPromise = getTeamStats(team);
  const membersPromise = getTeamMembers(team);

  const [stats, members] = await Promise.all([statsPromise, membersPromise]);

  return <DashboardView stats={stats} members={members} />;
}
```

```tsx
// Server Action with auth and revalidation
"use server";

import { revalidatePath } from "next/cache";

export async function createPost(formData: FormData) {
  const session = await auth();
  if (!session?.user) {
    throw new Error("Unauthorized");
  }

  await db.post.create({
    data: {
      title: String(formData.get("title")),
    },
  });

  revalidatePath("/posts");
}
```

```ts
// Route Handler for explicit HTTP handling
import type { NextRequest } from "next/server";

export async function GET(_request: NextRequest, ctx: RouteContext<"/api/posts/[id]">) {
  const { id } = await ctx.params;
  const post = await db.post.findUnique({ where: { id } });

  return Response.json(post);
}
```

## Commands

```bash
# Run Next.js locally
npm run dev

# Production build validation
npm run build

# Upgrade a project to the latest supported Next.js/React versions
npx @next/codemod@canary upgrade latest

# Migrate async request APIs such as params, cookies, and headers
npx @next/codemod@canary next-async-request-api .
```

## Resources

- App Router and runtime API details: [references/app-router-and-runtime-apis.md](references/app-router-and-runtime-apis.md)
- Fetching, waterfalls, and caching strategy: [references/data-fetching-waterfalls-and-cache.md](references/data-fetching-waterfalls-and-cache.md)
- Mutations, route handlers, and security: [references/server-actions-route-handlers-and-security.md](references/server-actions-route-handlers-and-security.md)
- Streaming, serialization, and hydration: [references/streaming-serialization-and-hydration.md](references/streaming-serialization-and-hydration.md)
