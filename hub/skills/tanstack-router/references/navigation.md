# Navigation

## Rules

- Prefer `Link` for standard navigation.
- Use `useNavigate` only for side effects.
- Use route masks for modal URLs.

## Minimal example

```tsx
import { Link, useNavigate } from '@tanstack/react-router';

<Link
  to="/products/$productId"
  params={{ productId: product.id }}
  preload="intent"
>
  View
</Link>;

const navigate = useNavigate();
navigate({ to: '/products' });

<Link
  to="/products/$productId"
  params={{ productId: product.id }}
  mask={{ to: '/products' }}
>
  Quick view
</Link>;
```
