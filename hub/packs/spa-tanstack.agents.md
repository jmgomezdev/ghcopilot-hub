# AGENTS

Base workflow for repositories initialized with the spa-tanstack pack.

## Stack Focus

- React SPA architecture with the TanStack ecosystem.
- Forms, routing, query state, testing, and state management as the default baseline.

## Recommended Workflow

1. Plan navigation, server-state ownership, and form flows before building screens.
2. Keep routing, query orchestration, and client state responsibilities explicit.
3. Use shared skills to keep architecture and testing conventions consistent.

## Guardrails

- Avoid mixing server-state and local UI state without a clear boundary.
- Prefer route-aware and query-aware design over ad hoc component wiring.
