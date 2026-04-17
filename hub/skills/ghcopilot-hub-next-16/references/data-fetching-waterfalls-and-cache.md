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

## Next.js 16 Fetch Defaults

For broad Next.js 16 guidance, assume these defaults:

- `fetch()` is not cached by default
- `GET` Route Handlers are not cached by default

Do not give advice based on older static-by-default assumptions.

## Caching Options

Choose one explicit strategy instead of mixing several blindly. In Next.js 16 code that uses Cache Components, prefer the `use cache` family first.

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

### Cache Components-first caching

Prefer `'use cache'` for new Next.js 16 App Router code when Cache Components is enabled. It defines a cached scope instead of attaching caching behavior to individual `fetch()` calls.

If the codebase already uses older caching controls, recommend migrating them to `'use cache'` plus `cacheLife()` instead of keeping them as equal alternatives.

### Route handler caching

For modern Next.js 16 guidance, do not introduce `export const dynamic = 'force-static'` as the route handler caching recommendation. Prefer the Cache Components model and keep route-level config out of new advice unless the task is specifically about older migration boundaries.

If a route handler or page still uses older caching exports in a Cache Components project, point the user back to the Cache Components migration path rather than preserving that model in new guidance.

### Cache Components and Distributed Caching in Next.js 16

If the project uses Cache Components (`cacheComponents: true` in `next.config.js`), you can rely on three key directives:

- `'use cache'`: server memory cache per instance, not shared across serverless instances
- `'use cache: remote'`: distributed remote cache; on Vercel this maps to the regional Runtime Cache and is shared across instances in the same region
- `'use cache: private'`: per-user private cache in browser memory, which can read `cookies()`, `headers()`, and `searchParams`

Advanced example:

```tsx
import { cookies } from "next/headers";
import { cacheLife, cacheTag } from "next/cache";

export async function getFeaturedProducts() {
  "use cache: remote";
  cacheTag("products");
  cacheLife("max");
  return db.products.findMany({ where: { featured: true } });
}

export async function getProductPrice(productId, currency) {
  "use cache: remote";
  cacheTag(`product-price-${productId}`);
  cacheLife({ expire: 3600 }); // 1 hour
  return db.products.getPrice(productId, currency);
}

export async function getRecommendations(productId) {
  "use cache: private";
  cacheTag(`recommendations-${productId}`);
  cacheLife({ stale: 60 });
  const sessionId = (await cookies()).get("session-id")?.value || "guest";
  return getPersonalizedRecommendations(productId, sessionId);
}
```

#### Expiration Profiles

You can use built-in profiles such as `'minutes'`, `'hours'`, `'days'`, `'weeks'`, and `'max'`, or pass an object with `{ stale, revalidate, expire }` in seconds.

```tsx
cacheLife({
  stale: 300, // 5 min: serve stale content while refreshing
  revalidate: 600, // 10 min: background revalidation interval
  expire: 3600, // 1 hour: hard expiration
});
```

#### Invalidation

Each cached function can register tags with `cacheTag()`. Use `revalidateTag()` for stale-while-revalidate behavior, or `updateTag()` for immediate expiration so the next read within the same flow fetches fresh data. `updateTag()` is only available in Server Actions.

```tsx
import { revalidateTag, updateTag } from "next/cache";

// Revalidate only product data
export async function onProductUpdate() {
  revalidateTag("products");
}

// Expire immediately and fetch fresh data
export async function updateProduct() {
  updateTag("products");
}
```

#### Restrictions and Best Practices

- `'use cache: remote'` cannot read `cookies()`, `headers()`, or `searchParams` inside the cached function. Read those values first and pass them as arguments.
- `'use cache: private'` can read `cookies()`, `headers()`, and `searchParams`, but the cache only lives in browser memory and does not survive a full reload.
- On Vercel, the remote cache is regional and is not shared across regions or environments such as preview and production. It is non-durable, so entries may be evicted under pressure, but it survives deployments.
- If you self-host, configure `cacheHandlers` in `next.config.js` to back remote caching with your own durable store such as Redis or DynamoDB.
- Cache key design matters. Prefer dimensions with low cardinality such as locale or currency, then filter or personalize in memory after the cache boundary.

#### Anti-Patterns

- Do not cache per-user data unless you are intentionally using `'use cache: private'`.
- Do not mix remote and private caches in the same nested cache tree.
- Do not assume `'use cache'` is enough on serverless infrastructure; each instance keeps its own in-memory cache.

#### Official References

- [use cache: remote directive](https://github.com/vercel/next.js/blob/v16.2.2/docs/01-app/03-api-reference/01-directives/use-cache-remote.mdx)
- [use cache: private directive](https://github.com/vercel/next.js/blob/v16.2.2/docs/01-app/03-api-reference/01-directives/use-cache-private.mdx)
- [cacheLife profiles and expiry](https://github.com/vercel/next.js/blob/v16.2.2/docs/01-app/03-api-reference/04-functions/cacheLife.mdx)
- [revalidateTag and updateTag](https://github.com/vercel/next.js/blob/v16.2.2/docs/01-app/01-getting-started/09-caching-and-revalidating.mdx)

Verify that `cacheComponents` is enabled before recommending these strategies.
