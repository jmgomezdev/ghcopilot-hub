# Data Fetching, Waterfalls, and Cache

Use this reference when routes are slow, fetch behavior is unclear, or the task involves revalidation and cache
correctness.

## Fast Diagnosis Table

| Symptom                                  | Likely cause                  | First move                                            |
| ---------------------------------------- | ----------------------------- | ----------------------------------------------------- |
| Route waits on several calls in one file | Sequential awaits             | Start work first, then `Promise.all()`                |
| `loading.tsx` does not appear            | Dynamic read too high in tree | Move read deeper or add local `<Suspense>`            |
| Data is stale after mutation             | Missing invalidation plan     | Add `revalidatePath`, `revalidateTag`, or `updateTag` |
| Advice assumes static defaults           | Next 15 cache model mismatch  | Re-check fetch and route handler defaults             |
| Duplicate work in one render             | No request-level dedup        | Use `React.cache()` for that function                 |

## Server Components Are the Default Fetch Surface

Prefer fetching in Server Components or server-only utilities close to the component that needs the data.

Advantages:

- Secrets stay on the server
- No client-side waterfall just to load the first screen
- Less prop drilling when the data belongs to a specific route segment

## Remove Sequential Awaits

Independent async work should start before the first `await`.

```tsx
// Avoid this
const user = await getUser(id);
const posts = await getPosts(id);

// Prefer this
const userPromise = getUser(id);
const postsPromise = getPosts(id);
const [user, posts] = await Promise.all([userPromise, postsPromise]);
```

If one call depends on the previous result, keep it sequential, but consider wrapping the dependent subtree in
`<Suspense>` so the rest of the route can stream.

## Parallel Segments vs Sequential Work

Pages and layouts in the App Router can render segments in parallel, but inside a single async function you can still
create a waterfall by awaiting one operation after another.

Check both levels:

- route-segment structure
- await order within each function

## Next.js 15 Fetch Defaults

For broad Next.js 15 guidance, assume these defaults:

- `fetch()` is not cached by default
- `GET` Route Handlers are not cached by default

Do not give advice based on older static-by-default assumptions.

## Caching Options

Choose one explicit strategy instead of mixing several blindly.

### Per-request deduplication

Use `React.cache()` when multiple parts of the same request tree need the same async computation.

```ts
import { cache } from "react";

export const getCurrentUser = cache(async () => {
  return db.user.findFirst();
});
```

Rules:

- Scope: current request only
- Good for deduplication, not persistence across users or deployments
- Safe for server-side sharing inside one render pass

### Explicit fetch caching

Use `fetch(..., { cache: 'force-cache' })` when an HTTP request should be cached.

### Segment-level fetch defaults

Use `export const fetchCache = 'default-cache'` when a layout or page should default its fetches to cached behavior.

### Route handler caching

Use route segment config such as `export const dynamic = 'force-static'` when a `GET` Route Handler should be cached.

### Cache Components model

If the project uses Cache Components, prefer `use cache` with `cacheLife()` and optional tagging APIs.

```tsx
import { cacheLife, cacheTag } from "next/cache";

export async function getCatalog() {
  "use cache";
  cacheLife("hours");
  cacheTag("catalog");

  return db.product.findMany();
}
```

Do not assume Cache Components is enabled. Verify the repo before prescribing `use cache` as the only solution.

## Runtime APIs and Cache Boundaries

Request-time APIs such as `cookies()` and `headers()` pull work to request time. In cache-oriented routes:

- Isolate runtime reads to the smallest subtree possible
- Wrap those subtrees in `<Suspense>`
- Pass extracted runtime values into cached functions instead of reading runtime APIs deep inside cached logic

```tsx
async function SessionGate() {
  const sessionId = (await cookies()).get("session")?.value;
  return <CachedDashboard sessionId={sessionId ?? null} />;
}

async function CachedDashboard({ sessionId }: { sessionId: string | null }) {
  "use cache";
  return <DashboardData sessionId={sessionId} />;
}
```

## Revalidation Strategy

Every cache recommendation must answer: how does this become fresh again?

Choose based on ownership:

- `revalidatePath('/posts')` when the route path is the invalidation unit
- `revalidateTag('posts')` when many routes consume the same logical dataset
- `updateTag('posts')` when using tagged cached content and you want immediate expiry after a mutation
- `refresh()` when the client router should refetch current route state, but note this does not replace tag invalidation

Pick one owner for freshness. If you cannot name the owner, the cache design is not ready yet.

## Streaming Uncached Data

For fresh per-request data:

- do not force cache it just to avoid a loading state
- put it behind `loading.tsx` or a local `<Suspense>` boundary

The correct tradeoff is often cached shell plus streamed dynamic island.

## Anti-Patterns

Avoid these recommendations unless you have verified they are appropriate:

- “Everything in Next is cached automatically”
- “Use `use client` so you can fetch in the browser” for first-load route data
- “Use `React.cache()` for cross-request caching”
- “Add `revalidatePath()` everywhere” without identifying the owning path or tag
- "Wrap everything in `no-store`" when only one subtree truly needs fresh data
- "Add `use cache`" without checking whether Cache Components is even enabled in the project
