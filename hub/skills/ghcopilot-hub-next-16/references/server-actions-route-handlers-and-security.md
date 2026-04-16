# Server Actions, Route Handlers, and Security

Use this reference when the task involves mutations, APIs, webhooks, cookies, auth, or deciding between a Server
Action and a Route Handler.

## Action vs Route Handler

| Need                                                 | Prefer        | Why                                                       |
| ---------------------------------------------------- | ------------- | --------------------------------------------------------- |
| User submits a form inside app UI                    | Server Action | UI and mutation can roundtrip together                    |
| Button-triggered mutation tied to current route tree | Server Action | Better fit for App Router mutation flows                  |
| Webhook receiver                                     | Route Handler | Needs explicit HTTP semantics and external caller support |
| Public API for other services                        | Route Handler | Server Actions are not an external API contract           |
| CORS, OPTIONS, or custom status/header control       | Route Handler | HTTP behavior is first-class                              |
| XML/RSS/file/stream response                         | Route Handler | Non-UI response surface                                   |

## Server Actions Are Server Functions Used for Mutations

Server Actions are async server functions invoked through forms or client-triggered network requests.

Use them for:

- Form submissions in App Router UIs
- Mutations tied closely to the route tree
- Flows that should return updated UI in the same roundtrip

Prefer defining them:

- inline in a Server Component for very local actions
- in a dedicated `'use server'` module when shared across components

## Security Rule: Validate Inside Every Action

Treat every Server Action like a public POST entry point.

Always verify inside the action:

- authentication
- authorization
- input parsing and validation
- resource ownership
- tenant or role scope when applicable

Do not rely on these alone:

- UI guards
- hidden inputs
- middleware-only protection
- optimistic client assumptions

NEVER trust hidden inputs, client-owned IDs, or button visibility as authorization.

## Prefer Route Handlers When HTTP Semantics Matter

Use a Route Handler instead of a Server Action when you need:

- explicit HTTP methods
- webhook ingestion
- public APIs
- CORS management
- file, XML, RSS, or non-UI responses
- streaming responses using Web APIs
- endpoints called by third parties or other services

Route Handlers speak standard `Request` and `Response`, with optional `NextRequest` helpers.

## Route Handler Rules

- Support explicit methods: `GET`, `POST`, `PUT`, `PATCH`, `DELETE`, `HEAD`, `OPTIONS`
- In Next.js 16, `GET` handlers are not cached by default
- Dynamic params arrive as a promise and must be awaited
- Prefer `Response.json()` or `Response` over custom wrapper abstractions unless the repo already uses one

```ts
export async function POST(request: Request) {
  const body = await request.json();
  return Response.json({ ok: true, body });
}
```

## Forms, Pending States, and Client Wiring

For user-facing form mutations, prefer form-based actions and pending states over ad hoc button state machines.

The Next-specific concern here is choosing a Server Action as the mutation surface. The internal client hook design is
still owned by `ghcopilot-hub-react`.

```tsx
"use client";

import { useActionState } from "react";
import { createPost } from "@/app/actions";

export function CreatePostForm() {
  const [_state, action, pending] = useActionState(createPost, null);

  return (
    <form action={action}>
      <input name="title" required />
      <button disabled={pending}>{pending ? "Saving..." : "Save"}</button>
    </form>
  );
}
```

When invoking actions from custom event handlers, keep the UX explicit and avoid treating them as a replacement for
parallel data fetching.

## Revalidation and Redirect Ordering

Typical mutation order:

1. Authenticate and authorize
2. Parse and validate input
3. Perform mutation
4. Revalidate path or tag
5. Redirect if needed

`redirect()` ends control flow for the action. Anything after it is dead code.

## Cookies in Actions

Actions can read, set, and delete cookies using `await cookies()`.

Cookie writes cause the current route tree to re-render on the server so the UI reflects the new cookie state.

## Middleware, Auth, and Coverage Gaps

In Next.js 16 repositories, middleware can still be part of auth or redirect flows, but it is not sufficient as the only
security boundary.

Why:

- action coverage depends on route placement and matching
- refactors can change whether a path is intercepted
- copied URLs and direct POSTs bypass UI assumptions

Use middleware for coarse request shaping. Use Server Actions and Route Handlers for the actual authorization checks.

## Anti-Patterns

- NEVER expose integration endpoints as Server Actions just because they accept POST.
- NEVER call `redirect()` before invalidation if fresh data must be visible on the next screen.
- NEVER use Route Handlers as a default replacement for all mutations; they are for explicit HTTP contracts, not every UI
  write path.

## Webhooks and External Consumers

For webhooks:

- use Route Handlers
- parse the raw body in the format the provider expects
- verify signatures before mutating data
- return explicit status codes and failure messages

Do not model third-party webhook receivers as Server Actions.
