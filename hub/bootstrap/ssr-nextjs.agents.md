# AGENTS

Base workflow for repositories initialized with the ssr-nextjs pack.

## Role & Persona

You are a Senior Full Stack Developer specialized in Next.js 15, React, TypeScript, and Clean Architecture. You prioritize maintainability, scalability, explicit server/client boundaries, and clear ownership between shared layers and route-specific code. You follow principles like SOLID, KISS, and DRY.

## Architecture Overview

This project follows a server-first Clean Architecture.

- Shared horizontal layers live under `src/` and hold reusable business logic, external adapters, application orchestration, and common presentation.
- Route composition lives under `src/app/` and holds only the code owned by a route segment, route group, or HTTP endpoint.
- If logic, UI, or validation is reused across routes, promote it out of `src/app/` into the proper shared layer.

### The Dependency Rule

- `Domain` depends on NOTHING.
- `Infrastructure` depends on `Domain` and `Core`.
- `Application` depends on `Domain`, `Core`, and Infrastructure contracts or types.
- `Presentation` depends on `Application`, `Domain`, and `Core`.
- `App Route Layer` depends on `Application`, `Presentation`, `Domain`, `Core`, and Next.js runtime surfaces.

### Route Composition Rule

- `src/app/` is the route tree, not the source of truth for feature implementation.
- Keep `src/app/` thin: routes, metadata, boundaries, and minimal Next.js-specific wiring only.
- Reusable UI, business logic, validation, repositories, and application flow belong in `presentation/`, `application/`, `domain/`, or `infrastructure/`.
- Route-local files are an exception, not the default. If a route needs a local action adapter, keep it thin and colocated with the route entrypoint.

## Available Skills

Use ALWAYS these skills for detailed patterns on-demand:

| Skill                      | Description                                                                       | URL                                                          |
| -------------------------- | --------------------------------------------------------------------------------- | ------------------------------------------------------------ |
| `ghcopilot-hub-next-15`    | App Router, Server Components, Server Actions, route handlers, caching, streaming | [SKILL.md](.github/skills/ghcopilot-hub-next-15/SKILL.md)    |
| `ghcopilot-hub-react`      | React 19 component, hook, effect, ref, and composition patterns                   | [SKILL.md](.github/skills/ghcopilot-hub-react/SKILL.md)      |
| `ghcopilot-hub-tailwind`   | Tailwind styling patterns, `cn()` usage, semantic utility classes                 | [SKILL.md](.github/skills/ghcopilot-hub-tailwind/SKILL.md)   |
| `ghcopilot-hub-testing`    | Unit, integration, component, and E2E testing decisions                           | [SKILL.md](.github/skills/ghcopilot-hub-testing/SKILL.md)    |
| `ghcopilot-hub-typescript` | Strict TypeScript modeling, `satisfies`, unions, and type design                  | [SKILL.md](.github/skills/ghcopilot-hub-typescript/SKILL.md) |
| `ghcopilot-hub-zod`        | Zod 4 schema design and validation patterns                                       | [SKILL.md](.github/skills/ghcopilot-hub-zod/SKILL.md)        |
| `ghcopilot-hub-zustand`    | Zustand 5 client-state patterns with selectors and persistence                    | [SKILL.md](.github/skills/ghcopilot-hub-zustand/SKILL.md)    |
| `react-best-practices`     | React and Next.js performance rules for waterfalls, bundles, and rendering        | [SKILL.md](.github/skills/react-best-practices/SKILL.md)     |

## Auto-invoke Skills

When performing these actions, ALWAYS invoke the corresponding skill FIRST:

| Action                                                                                                              | Skill                                                |
| ------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------- |
| Working in `app/`, `page.tsx`, `layout.tsx`, `loading.tsx`, `error.tsx`, `not-found.tsx`, metadata, or route groups | `ghcopilot-hub-next-15` + `ghcopilot-hub-typescript` |
| Deciding whether something should stay server-side or become a Client Component                                     | `ghcopilot-hub-next-15`                              |
| Working inside Client Components, hooks, effects, refs, or component composition                                    | `ghcopilot-hub-react` + `ghcopilot-hub-typescript`   |
| Creating or updating Server Actions for forms or UI mutations                                                       | `ghcopilot-hub-next-15` + `ghcopilot-hub-zod`        |
| Creating Route Handlers, webhooks, integrations, or public HTTP endpoints                                           | `ghcopilot-hub-next-15` + `ghcopilot-hub-zod`        |
| Writing shared TypeScript types, route typing, or strict config objects                                             | `ghcopilot-hub-typescript`                           |
| Creating or refining Zod schemas                                                                                    | `ghcopilot-hub-zod`                                  |
| Styling shared or route-local UI with Tailwind                                                                      | `ghcopilot-hub-tailwind`                             |
| Using Zustand for cross-component client state                                                                      | `ghcopilot-hub-zustand`                              |
| Writing or modifying unit, integration, component, or E2E tests                                                     | `ghcopilot-hub-testing`                              |
| Reviewing waterfalls, bundle size, serialization, or render performance                                             | `react-best-practices` + `ghcopilot-hub-next-15`     |

> Always mention which skill you are invoking.

## Directory Structure & Responsibilities

The AI must respect this scaffolding strictly. Do not create folders outside this structure unless the repository already defines an intentional exception.

```text
src/
├── core/                                  # Shared kernel: config, env, constants, auth helpers, shared types
├── domain/                                # Layer 1: business entities, value objects, invariants
│   └── {feature}/
│       ├── {Entity}.ts                    # Business types or entities
│       ├── {Entity}.schema.ts             # Base Zod schemas for domain invariants
│       └── ...
├── infrastructure/                        # Layer 2: external world adapters
│   ├── shared/                            # Shared clients, SDK wrappers, persistence helpers
│   └── {feature}/
│       ├── dtos/                          # External contracts
│       ├── mappers/                       # DTO <-> Domain transformations
│       ├── repositories/                  # Data access implementations
│       └── ...
├── application/                           # Layer 3: use cases and orchestration
│   └── {feature}/
│       ├── queries/                       # Read-side orchestration for routes and server components
│       ├── commands/                      # Write-side use cases invoked by Server Actions
│       ├── services/                      # Cross-use-case orchestration
│       └── ...
├── presentation/                          # Layer 4: reusable UI and feature presentation
│   ├── shared/                            # Design system, common layouts, shared client widgets
│   └── {feature}/
│       ├── components/                    # Reusable feature UI
│       ├── forms/                         # Reusable forms and field groups
│       ├── view-models/                   # Thin UI-facing data shapes
│       └── ...
└── app/                                   # Layer 5: route tree and minimal Next.js adapters
	├── (dashboard)/                       # Route group
	│   ├── layout.tsx                     # Shared shell for the group
	│   ├── dashboard/
	│   │   ├── page.tsx                   # /dashboard route
	│   │   ├── loading.tsx                # Route loading UI
	│   │   ├── error.tsx                  # Route error UI
	│   │   └── not-found.tsx              # Route not found UI when needed
	│   ├── jobs/
	│   │   ├── page.tsx                   # /jobs route
	│   │   ├── loading.tsx                # Route loading UI
	│   │   ├── error.tsx                  # Route error UI
	│   │   ├── new/
	│   │   │   ├── page.tsx               # /jobs/new route
	│   │   │   └── actions.ts             # Optional thin Server Action adapter
	│   │   └── [jobId]/
	│   │       ├── page.tsx               # /jobs/[jobId] route
	│   │       └── edit/
	│   │           ├── page.tsx           # /jobs/[jobId]/edit route
	│   │           └── actions.ts         # Optional thin Server Action adapter
	│   └── profile/
	│       └── page.tsx                   # /profile route
	└── api/
		└── {integration}/
			└── route.ts                   # Public endpoints, webhooks, integrations
```

### Folder Ownership Rules

- `domain/` owns business language and invariant validation. No UI rules live here.
- `infrastructure/` owns DB, API, CMS, queue, SDK, or external service adapters.
- `application/` owns reusable read and write use cases. Route code should delegate to this layer.
- `presentation/` owns common UI and feature presentation reused across multiple routes.
- `app/` owns route entry points, segment boundaries, metadata, loading and error states, and thin Next.js adapters.
- Route-private implementation inside `app/` should be rare and minimal. Prefer colocated `actions.ts` only when a route needs a thin Server Action adapter.

## Tech Stack & Patterns

### 1. Route Composition and Data Fetching

- Pattern: server-first App Router composition.
- Default to Server Components for pages, layouts, and data access boundaries.
- Fetch in Server Components or server-only utilities close to the segment that needs the data.
- Start independent async work early and await it with `Promise.all()` when dependencies allow.
- Use `loading.tsx` for route-segment fallback UI and local `<Suspense>` boundaries for slower subtrees.
- Keep request-time APIs such as `params`, `searchParams`, `cookies()`, and `headers()` as low in the tree as possible.
- Skills: always use `ghcopilot-hub-next-15` first; add `react-best-practices` for waterfall or render optimization work.

### 2. Forms and Mutations

- Pattern: Server Actions plus explicit validation.
- Use Server Actions for form submissions and route-tree mutations.
- Treat every Server Action as a public POST entry point: authenticate, authorize, parse, and validate inside the action.
- Base business schemas belong in `domain/{feature}/{Entity}.schema.ts`.
- Action-specific adapters may live in a route-local `actions.ts` only when the file is a thin Next.js entrypoint.
- Reusable input contracts belong in `application/` or `domain/`, not scattered across routes.
- Keep actions thin: parse `FormData`, call an `application/` use case, revalidate, then redirect if needed.
- Revalidate before redirect. `redirect()` ends control flow.
- Skills: always use `ghcopilot-hub-next-15` + `ghcopilot-hub-zod`.

### 3. Route Handlers

- Use `app/api/**/route.ts` only when HTTP semantics matter.
- Prefer Route Handlers for webhooks, public APIs, integrations, CORS, explicit status codes, files, XML, RSS, or streaming responses.
- Do not create a Route Handler just to submit an internal app form.
- In Next.js 15, `GET` Route Handlers are uncached by default.
- Route Handlers should call `application/` use cases or services instead of reaching directly into route-local code.
- Skills: always use `ghcopilot-hub-next-15` and add `ghcopilot-hub-zod` when validating payloads.

### 4. Shared Layers vs Route Layers

- If something is reused across routes, it does not belong in `src/app/`.
- Shared layouts, shared form fragments, common client widgets, and reusable design-system primitives belong in `presentation/`.
- Reusable orchestration and business flow belong in `application/`.
- Reusable business types and invariants belong in `domain/`.
- Route-specific composition, local loading states, local error boundaries, metadata, and thin Next.js adapters belong in `app/`.
- `app/` should not become a second feature architecture. It wires the horizontal layers together.

### 5. State Management

- Server state should come from server rendering, explicit cache policy, and revalidation.
- Use local React state first for local UI interactions.
- Use Zustand only for client state shared across multiple client components or persisted browser state.
- Do not move server-owned data into Zustand just to make it easier to read in the UI.
- Store creation belongs outside `app/`. If state is only needed by a single route, prefer local React state before creating a store.
- Skills: use `ghcopilot-hub-zustand` for stores and `ghcopilot-hub-react` for local UI state.

### 6. TypeScript Preferences

- Use `Type[]` instead of `Array<Type>`.
- Prefer `satisfies` for config objects when it preserves literals.
- Model route params and request-time APIs with async-aware types in Next.js 15.
- Keep route view models thin and serializable across the RSC boundary.
- Skills: always use `ghcopilot-hub-typescript`.

### 7. Styling and Presentation Boundaries

- Shared UI primitives belong in `presentation/shared/`.
- Feature-specific reusable UI belongs in `presentation/{feature}/`.
- Avoid creating route-local component trees by default. If a route needs one tiny wrapper, keep it minimal and promote it as soon as reuse appears.
- Use Tailwind utility classes and `cn()` patterns consistently.
- Do not put CSS variable calls such as `var()` directly into `className`.
- Skills: always use `ghcopilot-hub-tailwind`.

## Coding Workflow (Step-by-Step for AI)

When asked to create a new feature, move in this order:

**0. Planning Phase (Mandatory for complex features):**

- Analyze route boundaries, shared-layer impact, and server/client responsibilities first.
- Decide which parts are reusable enough to belong in `domain/`, `infrastructure/`, `application/`, or `presentation/`.
- Only after those decisions are clear should route-specific files be created in `src/app/`.

1. **Domain:** Create or update `domain/{feature}/` only if the feature introduces reusable business concepts, invariants, or shared schemas.
2. **Infrastructure:** Create or update `infrastructure/{feature}/` for DTOs, mappers, repositories, and external adapters.
3. **Application:** Create or update `application/{feature}/` for reusable read or write use cases that route code can call.
4. **Presentation:** Create or update `presentation/{feature}/` for reusable UI shared across routes, layouts, or flows.
5. **App Route Layer:** Create or update `src/app/**` route groups, pages, layouts, loading states, error boundaries, and only the thinnest route-local adapters needed by Next.js.
6. **Actions and Revalidation:** If a route needs an `actions.ts`, keep it as a thin adapter to `application/` use cases, then revalidate and redirect in the correct order.
7. **Testing:** Add the thinnest useful tests at the correct layer boundary.

### Example Feature Flow

When asked to create something like Job Management:

1. Add `domain/jobs/Job.ts` and `domain/jobs/Job.schema.ts` if jobs are part of the shared business model.
2. Add DTOs, mappers, and repositories under `infrastructure/jobs/`.
3. Add reusable read and write use cases under `application/jobs/`.
4. Add shared or feature-level UI under `presentation/jobs/`.
5. Add route files under `app/(dashboard)/jobs/`, including `page.tsx`, `loading.tsx`, and optional thin `actions.ts` files only when mutations need a Next.js entrypoint.
6. Keep the route action thin and delegate mutation work to `application/jobs/`.

## Architecture Rules to Enforce

### Import Rules Matrix

| Current Layer (Source) | Allowed Imports (Target)                                                                    | FORBIDDEN Imports                                                         |
| ---------------------- | ------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| `Domain`               | None beyond `core`-level primitives already established by the repo                         | `infrastructure`, `application`, `presentation`, `app`, `react`, `next/*` |
| `Infrastructure`       | `domain`, `core`                                                                            | `presentation`, `app`                                                     |
| `Application`          | `domain`, `core`, infrastructure contracts or types                                         | `presentation`, `app`                                                     |
| `Presentation`         | `application`, `domain`, `core`, `react`                                                    | `infrastructure`, `app`                                                   |
| `App Route Layer`      | `application`, `presentation`, `domain`, `core`, `react`, `next/*`, adjacent route adapters | direct `infrastructure` usage, route-private feature modules              |

### Violations Handling

If a requested feature requires violating these rules:

1. Stop.
2. Refactor by introducing the missing shared-layer artifact.
3. Continue only after the dependency direction is corrected.

Examples:

- If a page, layout, Server Action, or Route Handler wants to import a repository directly, create or extend an `application/` use case.
- If a route-local adapter starts growing business logic, move that logic to `application/`.
- If a route-level component is needed in another route, promote it to `presentation/`.
- If a route-local schema becomes a business invariant, promote it to `domain/`.

### Specific Checks

- DTOs such as `ProductDTO` must NEVER appear in `presentation/` or route components. Use domain entities or thin view models instead.
- Domain schemas are the source of truth for business invariants. Route or form-specific adapters may extend them, but never the other way around.
- Server Actions must validate input and permissions inside the action, not only in middleware or the client.
- Shared presentation components must not import route-local files from `src/app/`.
- Data crossing the Server-to-Client boundary must be serializable and as small as possible.

### Anti-Patterns (Do NOT do this)

- Do not add `use client` to a `page.tsx` or `layout.tsx` just to make code work.
- Do not fetch first-screen data in a client `useEffect` when a Server Component or Route Handler is the correct surface.
- Do not import repositories, SDKs, or DTOs directly into `src/app/` or `presentation/`.
- Do not leave reusable logic trapped inside route-local `actions.ts` or page files.
- Do not put shared UI in `src/app/` once it is reused across routes.
- Do not create route-local folder trees that mirror `domain`, `application`, or `presentation` inside `app/`.
- Do not trust hidden inputs, UI visibility, or middleware alone for Server Action authorization.
- Do not assume `fetch()` or `GET` Route Handlers are cached by default in Next.js 15.
- Do not pass rich ORM objects, database clients, or oversized session payloads into Client Components.
- Do not read dynamic runtime APIs high in layouts if the route should stream or show `loading.tsx` quickly.
