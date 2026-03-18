# Private Routes

This reference describes how to implement private routes with TanStack Router while respecting the project Clean Architecture.

## Goals

- Share auth state across the route tree via Router context.
- Redirect early in `beforeLoad` for protected and public-only areas.
- Route index decides where to land based on auth and role.
- Layout routes group protected areas (admin, dashboard, etc.).
- Auth changes trigger redirects by invalidating the router.

## Architecture Rules

- Route files live in `src/interface/router/**`.
- Auth is owned by Application (query + hook), not by Interface or Presentation.
- Presentation provides Router context (no direct repository calls in routes).
- Redirects happen in `beforeLoad`, not inside page components.

## Router Context and Provider

Create a typed router context that includes `queryClient` and `auth`. Set `auth: undefined!` in router creation and pass the real value in the provider.

```tsx
import { QueryClient } from "@tanstack/react-query";
import { createRootRouteWithContext, createRouter } from "@tanstack/react-router";

type RouterContext = {
  queryClient: QueryClient;
  auth: AuthState | undefined;
};

export const rootRoute = createRootRouteWithContext<RouterContext>()({
  component: AppLayout,
});

const queryClient = new QueryClient();

export const router = createRouter({
  routeTree,
  context: { queryClient, auth: undefined! },
  defaultPreload: "intent",
  defaultPreloadStaleTime: 0,
});
```

```tsx
import { RouterProvider } from "@tanstack/react-router";

import { useAuth } from "@/application/auth/hooks/useAuth";
import { router } from "@/interface/router";

export function AuthedRouterProvider() {
  const auth = useAuth();

  React.useEffect(() => {
    router.invalidate();
  }, [auth]);

  return <RouterProvider router={router} context={{ auth }} />;
}
```

## Route Groups and Redirects

Use pathless route groups to separate authenticated and unauthenticated sections. Place these in `src/interface/router/routes/`.

```
routes/
  _authenticated/
    route.tsx
    admin/
      route.tsx
  _unauthenticated/
    route.tsx
  index.tsx
```

### Protected group

```tsx
import { Outlet, createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated")({
  beforeLoad: ({ context: { auth } }) => {
    if (!auth?.user) {
      throw redirect({ to: "/login" });
    }
  },
  component: RouteComponent,
});

function RouteComponent() {
  return <Outlet />;
}
```

### Public-only group

```tsx
import { Outlet, createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_unauthenticated")({
  beforeLoad: ({ context: { auth } }) => {
    if (auth?.user) {
      throw redirect({ to: "/admin" });
    }
  },
  component: RouteComponent,
});

function RouteComponent() {
  return <Outlet />;
}
```

## Index Redirect

Index route decides where to land based on auth and role.

```tsx
import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  beforeLoad: ({ context: { auth } }) => {
    if (!auth?.user) {
      throw redirect({ to: "/login" });
    }

    if (auth.user.role === "admin") {
      throw redirect({ to: "/admin" });
    }

    throw redirect({ to: "/products" });
  },
  component: PageLoader,
});
```

## Layout Route for Admin

Use a layout route to wrap all admin pages and redirect bare `/admin` to a default child.

```tsx
import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated/admin")({
  beforeLoad: ({ location }) => {
    if (location.pathname === "/admin") {
      throw redirect({ to: "/admin/profile" });
    }
  },
  component: AdminDashboardLayout,
});
```

## Auth Change Redirects

Invalidate the router when auth changes so `beforeLoad` runs again. Also invalidate the auth query when login/logout happens.

```tsx
queryClient.invalidateQueries({ queryKey: ["auth"] });
```

## Common Pitfalls

- Do not fetch auth directly in routes or pages.
- Do not handle redirects inside page components.
- Do not import DTOs or repositories in Presentation or Interface routes.
