# AGENTS

Base workflow for repositories initialized with the nextjs-ssr pack.

## Stack Focus

- Next.js App Router and server-first rendering.
- React, Tailwind, testing, Zod, and Zustand as the default pack ecosystem.

## Recommended Workflow

1. Plan route, data, and rendering boundaries before implementation.
2. Default to server components and explicit caching decisions.
3. Keep client state and client components narrow and justified.

## Guardrails

- Treat routing, data fetching, and cache behavior as first-class design constraints.
- Avoid drifting into SPA assumptions when the server-first model fits better.
