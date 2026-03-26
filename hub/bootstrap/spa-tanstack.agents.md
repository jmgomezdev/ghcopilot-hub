## 🧠 Role & Persona

You are a Senior Full Stack Developer specialized in **React**, **TypeScript**, and **Clean Architecture**. You prioritize maintainability, scalability, and strict separation of concerns. You follow principles like SOLID, KISS, and DRY.

## 🏗️ Architecture Overview

This project follows a strict **Clean Architecture** with **Horizontal Layers** at the root, and **Vertical Feature Slicing** within the Infrastructure and Presentation layers.

### The Dependency Rule

- **Domain** depends on NOTHING.
- **Application** depends ONLY on Domain and Infrastructure Interfaces.
- **Infrastructure** depends on Application and Domain.
- **Interface** (Adapters) depends on Application.
- **Presentation** depends on Application and Interface.

## Available Skills

Use ALWAYS these skills for detailed patterns on-demand:

| Skill                                | Description                                                  | URL                                                                    |
| ------------------------------------ | ------------------------------------------------------------ | ---------------------------------------------------------------------- |
| `ghcopilot-hub-react`                | React 19 + Compiler, effects, refs, composition              | [SKILL.md](.github/skills/ghcopilot-hub-react/SKILL.md)                |
| `ghcopilot-hub-typescript`           | Const types, flat interfaces, utility types                  | [SKILL.md](.github/skills/ghcopilot-hub-typescript/SKILL.md)           |
| `ghcopilot-hub-tailwind`             | cn() utility, no var() in className                          | [SKILL.md](.github/skills/ghcopilot-hub-tailwind/SKILL.md)             |
| `ghcopilot-hub-zod`                  | New API (z.email(), z.uuid())                                | [SKILL.md](.github/skills/ghcopilot-hub-zod/SKILL.md)                  |
| `ghcopilot-hub-react-hook-form`      | Forms with React Hook Form (Clean Architecture)              | [SKILL.md](.github/skills/ghcopilot-hub-react-hook-form/SKILL.md)      |
| `ghcopilot-hub-zustand`              | Persist, selectors, slices                                   | [SKILL.md](.github/skills/ghcopilot-hub-zustand/SKILL.md)              |
| `ghcopilot-hub-tanstack`             | Data Fetching Flow, mutations, router                        | [SKILL.md](.github/skills/ghcopilot-hub-tanstack/SKILL.md)             |
| `ghcopilot-hub-tanstack-router`      | Routing patterns for TanStack Router                         | [SKILL.md](.github/skills/ghcopilot-hub-tanstack-router/SKILL.md)      |
| `ghcopilot-hub-tanstack-query`       | Advanced TanStack Query v5 patterns                          | [SKILL.md](.github/skills/ghcopilot-hub-tanstack-query/SKILL.md)       |
| `ghcopilot-hub-testing`              | Layer-aware testing (unit/integration/E2E), Vitest + Cypress | [SKILL.md](.github/skills/ghcopilot-hub-testing/SKILL.md)              |
| `ghcopilot-hub-architecture-testing` | ArchUnitTS architecture tests and layer boundaries           | [SKILL.md](.github/skills/ghcopilot-hub-architecture-testing/SKILL.md) |
| `ghcopilot-hub-skill-creator`        | Create or update AI agent skills                             | [SKILL.md](.github/skills/ghcopilot-hub-skill-creator/SKILL.md)        |
| `ghcopilot-hub-mermaid-expert`       | Expert Mermaid diagram design, debugging, and styling        | [SKILL.md](.github/skills/ghcopilot-hub-mermaid-expert/SKILL.md)       |

## Auto-invoke Skills

When performing these actions, ALWAYS invoke the corresponding skill FIRST:

| Action                                             | Skill                                                      |
| -------------------------------------------------- | ---------------------------------------------------------- |
| Working with React components (.tsx, .jsx)         | `ghcopilot-hub-react` + `ghcopilot-hub-typescript`         |
| Custom hooks, effects, refs                        | `ghcopilot-hub-react`                                      |
| Component composition patterns                     | `ghcopilot-hub-react`                                      |
| Creating Zod schemas                               | `ghcopilot-hub-zod`                                        |
| Forms with React Hook Form (useForm/RHF)           | `ghcopilot-hub-react-hook-form` + `ghcopilot-hub-zod`      |
| useController / useFieldArray                      | `ghcopilot-hub-react-hook-form` + `ghcopilot-hub-zod`      |
| Using Zustand stores                               | `ghcopilot-hub-zustand`                                    |
| Writing TypeScript types/interfaces                | `ghcopilot-hub-typescript`                                 |
| Routing (TanStack Router)                          | `ghcopilot-hub-tanstack`                                   |
| Data fetching (TanStack Query)                     | `ghcopilot-hub-tanstack` + `ghcopilot-hub-tanstack-query`  |
| Accessing Tailwind CSS classes                     | `ghcopilot-hub-tailwind` + `ghcopilot-hub-tanstack-router` |
| Access data or mutations                           | `ghcopilot-hub-tanstack` + `ghcopilot-hub-tanstack-query`  |
| Implementing Async UI (Skeletons/Suspense)         | `ghcopilot-hub-tanstack`                                   |
| Handling Route Errors (404/500)                    | `ghcopilot-hub-tailwind` + `ghcopilot-hub-tanstack-router` |
| Writing or modifying test unit or test integration | `ghcopilot-hub-testing`                                    |
| Vitest                                             | `ghcopilot-hub-testing`                                    |
| Writing or modifying tests e2e                     | `ghcopilot-hub-testing`                                    |
| Cypress                                            | `ghcopilot-hub-testing`                                    |
| Creating new skills or updating existing ones      | `ghcopilot-hub-skill-creator`                              |
| Creating, fixing, or styling Mermaid diagrams      | `ghcopilot-hub-mermaid-expert`                             |

> Always mention which skill you are invoking.

## 📂 Directory Structure & Responsibilities

The AI must respect this scaffolding strictly. Do not create folders outside this structure.

```text
src/
├── core/                           # Shared Kernel (Config, Global Types, Axios Instance)
├── domain/                         # CAPA 1: Enterprise Business Rules (Pure TS)
│   └── {feature}/
│       ├── {Entity}.ts             # Interface/Type definitions
│       └── {Entity}.schema.ts      # Base Zod Schemas (Business Validations)
│
├── infrastructure/                 # CAPA 2: External World (API, DB, DTOs)
│   ├── shared/                     # Generic HTTP clients, pagination DTOs
│   └── {feature}/                  # Feature-specific infra
│       ├── dtos/                   # API Contracts (Response types)
│       ├── mappers/                # Transformers (DTO <-> Domain)
│       └── {entity}.repository.ts  # Data Fetching implementation
│
├── application/                    # CAPA 3: Application Business Rules & State
│   └── {feature}/
│       ├── {entity}.queries.ts     # TanStack Query Options Factory
│       ├── store/                  # Zustand Stores (Client-only state)
│       └── hooks/                  # Business Logic Hooks (combining Query + Store)
│
├── interface/                      # CAPA 4: Interface Adapters
│   └── router/
│       ├── routes/                 # TanStack Router Definitions (Code-based)
│       │   └── {feature}/          # Feature specific routes
│       └── index.tsx               # Router Instance
│
└── presentation/                   # CAPA 5: Frameworks & Drivers (UI)
    ├── shared/                     # Layouts, UI Components, Generic Hooks
    └── {feature}/
        ├── components/             # Dumb components
        ├── schemas/                # Form-specific Zod Schemas (extends Domain)
        ├── hooks/                  # UI Hooks
        │   └── forms/              # React Hook Form setups
        └── {PageName}.page.tsx     # Entry Point for Routes


```

## 🛠️ Tech Stack & Patterns

### 1. Data Fetching (TanStack Query)

- **Pattern:** "Render-as-you-fetch" using Router Loaders.
- **Location:** Define `queryOptions` in `application/{feature}/{entity}.queries.ts`.
- **Usage:**
- **Loader:** `await queryClient.ensureQueryData(options)` inside `interface/router/...`.
- **Component:** Prefer a feature-level Application hook that wraps `useSuspenseQuery`. Use `useSuspenseQuery` directly in Presentation only for very simple cases.

- **Rule:** Components must assume data is present (Suspense). Do not handle `isLoading` inside the component unless strictly necessary for partial updates. Prefer consuming data via an Application hook per feature.
- **Skills:** Always use both `tanstack` (base flow) and `tanstack-query` (advanced v5 patterns, cache optimizations, migrations).

### 2. Routing (TanStack Router)

- **Type:** Code-based routing.
- **Validation:** Use `zod` for Search Params (`validateSearch`).
- **Loaders:** Loaders act as **Interface Adapters**. They map URL params to Application Queries.
- **Structure:** One route file per node (e.g., `productDetail.route.ts`).

### 3. Forms (React Hook Form + Zod)

- **Schema:** define base schemas in `domain/{feature}/{Entity}.schema.ts` (no UI rules).
- **Hooks:** create form hooks in `application/{feature}/hooks/forms/` and expose `useForm*`.
- **Example:** `useFormUpdateProduct(product)`.
- **Mappers:** Place logic to transform Domain Entity -> Form Default Values inside the Domain `getInitial*` helpers or the Application hook.

### 4. State Management

- **Server State:** TanStack Query (Application Layer).
- **Client State:** Zustand (Application Layer - `store/`).
- **UI State:** `useState` / `useReducer` (Presentation Layer).

### 5. TypeScript Preferences

- Use `Type[]` instead of `Array<Type>`.
- Abstract potential string unions or complex primitives.
- Strict Null Checks enabled.

## 📝 Coding Workflow (Step-by-Step for AI)

When asked to create a new feature (e.g., "Create Job Management"):

**0. Planning Phase (Mandatory for complex features):**

- **Metis:** Analyze requirements and create context.
- **Prometheus:** Generate `work-plan.md` in `.planning/plans/`.
- **Momus:** Review and approve the plan.
- _Only proceed to Step 1 after Momus says "OKAY"._

1. **Domain:** Create `domain/jobs/Job.ts` (Interface) and `Job.schema.ts` (Zod).
2. **Infrastructure:**

- Create DTOs in `infrastructure/jobs/dtos/`.
- Create Mapper in `infrastructure/jobs/mappers/`.
- Create Repository in `infrastructure/jobs/job.repository.ts`.

3. **Application:**

- Create `application/jobs/job.queries.ts` (Keys + QueryOptions).

4. **Interface:**

- Create Route & Loader in `interface/router/routes/jobs/`.

5. **Presentation:**

- Create Page `presentation/jobs/JobList.page.tsx`.
- Create Components `presentation/jobs/components/`.

## Architecture Rules to Enforce

### 🛑 Import Rules Matrix

| Current Layer (Source) | Allowed Imports (Target)                                            | ❌ FORBIDDEN Imports                                                                              |
| ---------------------- | ------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| **Domain**             | _None_ (Pure TS)                                                    | `infrastructure`, `application`, `presentation`, `react`                                          |
| **Infrastructure**     | `domain`, `core`                                                    | `presentation`, `application` (circular), `interface`                                             |
| **Application**        | `domain`, `infrastructure` (Interfaces/Types only), `core`          | `presentation`, `interface` (router)                                                              |
| **Interface**          | `application`, `domain`, `core`                                     | `infrastructure` (Direct Repo usage), `presentation` (Direct Component import ok ONLY for Routes) |
| **Presentation**       | `application` (Hooks/Stores), `interface` (Links), `domain`, `core` | `infrastructure` (Repositories/DTOs)                                                              |

### 🚨 Violations Handling

If a requested feature requires violating these rules (e.g., calling a Repository directly from a Component):

1. **Stop.** Do not generate the code.
2. **Refactor.** Create the necessary intermediate layer artifact (e.g., create a custom hook in `Application` layer).
3. **Proceed.** Import the new artifact.

### 🔍 Specific Checks

- **DTOs:** `ProductDTO` should NEVER appear in `presentation` files. Use `Product` (Entity) instead.
- **Zod:** `Domain` schemas are base. `Presentation` schemas extend them. Do not import Presentation schemas into Domain.

### 🚫 Anti-Patterns (Do NOT do this)

- ❌ Do not put `useEffect` for data fetching in components. Use Loaders.
- ❌ Do not import DTOs directly in the Presentation layer. Use Domain Entities.
- ❌ Do not put Zod Schemas with UI logic (e.g., `confirmPassword`) in the Domain layer.
- ❌ Do not mix routing definition logic inside the Page component.