# Tooling Map and Harness Strategy

## Goal

Pick the minimal toolchain that proves behavior at the target boundary.

## Tool Selection Matrix

| Objective | Primary Tooling | Optional Add-on | Avoid |
| --- | --- | --- | --- |
| Pure logic and schemas | Vitest (`node`) | table-driven tests | `jsdom`, network mocks |
| Hook orchestration | Vitest + `renderHook` (`jsdom`) | fake timers | Full page rendering when not needed |
| Repository transport contract | Vitest + MSW | fixture builders | Live API calls in CI |
| Loader and route adapters | Vitest + Router utilities + QueryClient | MSW for API responses | Browser E2E for adapter-only changes |
| UI interactions | RTL + `user-event` | accessibility assertions | CSS selector assertions |
| Cross-route journey | Cypress | selective API interception | Hook-level assertions |

## Environment Decision Rule

- Use `@vitest-environment node` for logic-only suites.
- Use `@vitest-environment jsdom` when rendering hooks/components.
- Never run all tests in `jsdom` by default if many logic tests exist.

## Query Client Test Harness (Recommended)

```ts
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook } from '@testing-library/react';

const createTestQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0, staleTime: 0 },
      mutations: { retry: false },
    },
  });

const createWrapper = () => {
  const queryClient = createTestQueryClient();
  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

renderHook(() => useFeatureHook(), { wrapper: createWrapper() });
```

## MSW Lifecycle Discipline

```ts
import { afterAll, afterEach, beforeAll } from 'vitest';
import { server } from '@/core/test/msw/server';

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
```

- `onUnhandledRequest: 'error'` is mandatory for contract drift visibility.
- Use per-test handler overrides, never global mutable handlers without reset.

## Cypress Positioning

- Keep Cypress focused on user journeys, route transitions, and browser/runtime integrations.
- Use `cy.intercept` only for unstable external systems; keep first-party API real when deterministic.

## Repository Commands (Verified)

```bash
npm run test
npm run test -- --watch
npm run test:e2e:open
npm run test:e2e:run
```

## Tooling Anti-Patterns

- Using MSW in domain tests.
- Reusing one QueryClient across test files.
- Leaving retries enabled in tests (hides failures and slows suites).
- Running Cypress to validate a single pure function branch.
