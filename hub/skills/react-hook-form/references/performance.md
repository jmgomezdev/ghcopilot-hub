# Performance Reference (RHF)

Load this file when the issue is about lag, excessive re-renders, unstable subscriptions, or expensive validation cycles.

## Quick Diagnosis Flow

1. Confirm where subscriptions happen.

- Search root form for `watch()` and broad `formState` usage.
- If parent subscribes, all children pay the render cost.

2. Confirm validation timing.

- `mode: 'onChange'` on large forms often creates avoidable work.
- Prefer `mode: 'onSubmit'` and `reValidateMode: 'onBlur'` unless UX requires immediate feedback.

3. Confirm hydration strategy.

- If code uses `useEffect + reset` for initial fetch, replace with async `defaultValues`.
- If entity identity changes later (edit A -> edit B), explicit `reset(nextDefaults)` is still required.

## Subscription Rules That Matter

- Use `useWatch` at the leaf where the value is consumed.
- Use `getValues` for one-time reads in event handlers or effects.
- Use `getFieldState(name)` for a single-field state check.
- Use `useFormState` in child components when only a subset of form state is needed.

Why:

- `watch()` at root subscribes the entire form.
- Reading full `formState` in a hot parent broadens subscriptions and increases render fan-out.

## `formState` Access Pattern

Bad:

```tsx
const { formState } = useFormContext<MyForm>();
return <SaveButton disabled={!formState.isValid || formState.isSubmitting} />;
```

Better:

```tsx
const {
  formState: { isSubmitting },
} = useFormContext<MyForm>();
return <SaveButton disabled={isSubmitting} />;
```

For single-field checks:

```tsx
const { getFieldState } = useFormContext<MyForm>();
const emailState = getFieldState("email");
```

## `shouldUnregister` Decision

| Scenario                                               | Use `shouldUnregister` | Why                                          |
| ------------------------------------------------------ | ---------------------- | -------------------------------------------- |
| Frequently mounted/unmounted conditional fragments     | Yes (case by case)     | Can reduce retained state footprint          |
| Multi-step wizards where hidden step data must persist | No                     | Unmounted fields lose values                 |
| Large tables with virtualization                       | Usually no             | Rows unmount often; unregister may drop data |

## Common Failure Modes

| Symptom                                            | Root Cause                                   | Fix                                                 |
| -------------------------------------------------- | -------------------------------------------- | --------------------------------------------------- |
| Typing in one field re-renders unrelated sections  | Root `watch()` or broad parent subscriptions | Move to leaf `useWatch`; split child components     |
| First dependent render misses latest value         | Subscription created after `setValue`        | Combine `useWatch` with initial `getValues` read    |
| Form flips uncontrolled/controlled                 | Missing `defaultValues` keys                 | Provide complete defaults for all mounted fields    |
| Async edit form loads stale values after id change | Async defaults run once per mount            | Call `reset(getInitial(entity))` on identity change |

## Never Do This

- Never put `methods` (whole `useForm` object) in a dependency array.
  Reason: object identity is unstable and can trigger loops.

- Never optimize by `memo` first while root subscriptions remain broad.
  Reason: subscription topology dominates; memo cannot fix wrong observer placement.

- Never disable resolver/schema stability by rebuilding schema in render.
  Reason: breaks caching and increases validation churn.

## Useful Commands

Use VS Code native search (`#tool:search`) with these patterns:

- Root `watch()` usage (often a hotspot):
  `query: watch\(\)` (regex), path: `src`
- Potential broad `formState` reads:
  `query: formState`, path: `src`
- `onChange` validation mode in large forms:
  `query: mode: 'onChange'`, path: `src`
