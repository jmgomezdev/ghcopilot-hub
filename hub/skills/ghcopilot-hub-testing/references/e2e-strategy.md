# Cypress E2E Strategy

## Goal

Validate critical user journeys across real route, browser, and network behavior with minimal flakiness.

## Scope Selection

Use E2E for:

- Route-to-route flows with real navigation and search params.
- Checkout/cart or other business-critical monetary flows.
- Auth/session flows and protected-route behavior.
- Browser integration behavior not covered by component tests.

Do not use E2E for:

- Pure business rule branches (unit test).
- Repository contract mapping (integration test).
- Loader param mapping only (interface integration test).

## Journey Matrix

| Journey Type      | Must Assert                               | Optional Assert                | Avoid                            |
| ----------------- | ----------------------------------------- | ------------------------------ | -------------------------------- |
| Product discovery | URL/search state + result list visibility | Sort/filter persistence        | Internal query cache state       |
| Cart flow         | Add/remove item visible outcome + totals  | Drawer open/close URL contract | Store implementation details     |
| Error recovery    | User-visible retry path                   | Telemetry hooks (if exposed)   | Direct network library internals |

## Selector Policy

Prefer semantic selectors first in E2E (`cy.findByRole`, labels, scoped queries), then fall back to stable
`data-testid` hooks when the UI surface does not expose a good semantic handle.

Never use styling selectors (`.btn-primary`, nth-child paths).

Prefer scoping before adding hooks:

```ts
cy.findByRole("navigation", { name: /primary/i }).within(() => {
  cy.findByRole("link", { name: /dashboards/i }).click();
});

cy.findByRole("dialog", { name: /save/i }).within(() => {
  cy.findByRole("button", { name: /confirm/i }).click();
});
```

## Network Strategy

- Keep first-party API real if deterministic in local run.
- Intercept external/unstable dependencies with `cy.intercept`.
- For known failure scenarios, use targeted intercepts per spec.

## State Isolation

- Each spec must be independently executable.
- Reset test data/session before each scenario.
- Do not rely on scenario execution order.

## Stability Rules

- Replace fixed waits with command retries and visible signals.
- Assert one business outcome per major step.
- Keep setup short and deterministic.

## Repository Commands

```bash
npm run test:e2e:open
npm run test:e2e:run
```

## Never Do

- Never assert framework internals from E2E.
- Never chain unrelated journeys in one giant spec.
- Never use global mutable fixtures without reset.
