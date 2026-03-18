---
name: ghcopilot-hub-react-hook-form
description: >
  High-performance React Hook Form patterns for Clean Architecture applications, including subscription isolation,
  controlled-component wiring, field-array safety, async defaults, and Zod boundary design. Use this skill when
  implementing or reviewing useForm, useWatch, useController, useFieldArray, resolver/defaultValues, or when
  debugging form re-render/performance issues in React + TypeScript projects.
license: Apache-2.0
metadata:
  author: jmgomezdev
  version: "1.0"
---

## When to Use

Use this skill when you need to:

- Create or refactor form hooks in `application/{feature}/hooks/forms/`.
- Integrate RHF with controlled UI libraries (Shadcn/Radix, MUI, AntD).
- Diagnose re-render storms, laggy typing, or unstable form state.
- Implement dynamic arrays with `useFieldArray` safely.
- Decide where validation rules belong between Domain/Application/Presentation.

## Progressive Loading Strategy

Read only what is needed for the current task.

| Scenario                                                                | Action                                                  |
| ----------------------------------------------------------------------- | ------------------------------------------------------- |
| Re-renders, lag, subscription issues (`watch`, `useWatch`, `formState`) | **MANDATORY**: Read `references/performance.md` fully.  |
| UI library wiring issues (`Controller`, `useController`, Shadcn/MUI)    | **MANDATORY**: Read `references/integration.md` fully.  |
| Dynamic rows/lists (`useFieldArray`, append/remove/reorder bugs)        | **MANDATORY**: Read `references/field-arrays.md` fully. |
| General form setup with no special issue                                | Stay in this file only.                                 |

Do NOT load reference files that are unrelated to the active scenario.

## Clean Architecture Boundaries

- Domain: base Zod schemas and business invariants only. No UI-only constraints.
- Application: form hooks (`useForm*`) and mapping to defaults.
- Presentation: rendering, input components, visual feedback, submit UX.

Boundary rule:

- Presentation must not import DTOs or repositories.
- Form-specific UI rules that do not belong to enterprise business rules live in Application.

## Expert Mindset

Before writing form code, ask:

- Subscription scope: "Who truly needs this value, and what is the smallest component that can subscribe?"
- Validation cost: "Can this rule run on submit/blur instead of every keystroke?"
- State ownership: "Is this server shape, domain shape, or UI-transient shape?"
- Mutation safety: "Will this array/input operation preserve RHF internal identity and state?"

These questions prevent the most common performance and consistency regressions.

## Critical Patterns

### 1) Stable `useForm` Baseline

Always provide explicit `defaultValues` and explicit validation timing.

```ts
export function useProfileForm(): UseFormReturn<ProfileForm> {
  return useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: getInitialProfile(),
    mode: "onSubmit",
    reValidateMode: "onBlur",
  });
}
```

Why this matters:

- Missing defaults causes uncontrolled/controlled drift and unreliable `reset` behavior.
- Aggressive modes (`onChange`) can inflate re-render and validation cost.

### 2) Isolate Subscriptions with `useWatch`

Watch as deep as possible, never broadly at the form root unless you intentionally need full-form updates.

```tsx
function OrderForm() {
  const { control, register, handleSubmit } = useOrderForm();

  return (
    <form onSubmit={handleSubmit(console.log)}>
      <input {...register("customerName")} />
      <ShippingPreview control={control} />
    </form>
  );
}

function ShippingPreview({ control }: { control: Control<OrderFormData> }) {
  const method = useWatch({ control, name: "shippingMethod" });
  return <p>Method: {method}</p>;
}
```

### 3) Isolate Controlled Inputs with `useController`

Wrap each controlled input in a leaf component so one input update does not re-render large parents.

```tsx
function ControlledCurrencyInput({
  control,
  name,
}: {
  control: Control<InvoiceForm>;
  name: "amount";
}) {
  const { field, fieldState } = useController({ control, name });

  return (
    <>
      <Input
        value={field.value}
        onBlur={field.onBlur}
        onChange={(e) => field.onChange(Number(e.target.value || 0))}
        ref={field.ref}
      />
      {fieldState.error?.message && <span>{fieldState.error.message}</span>}
    </>
  );
}
```

### 4) Keep Schemas and Resolvers Stable

Define schemas outside render scope. Never recreate schema/resolver per render.

```ts
export const loginSchema = z.object({
  email: z.email(),
  password: z.string().min(1, "Required"),
});

export function useLoginForm(): UseFormReturn<LoginForm> {
  return useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: getInitialLogin(),
    mode: "onSubmit",
  });
}
```

### 5) Use Async `defaultValues` for One-shot Hydration

When initial values depend on remote data, prefer async `defaultValues` over `useEffect + reset`.

```ts
export function useProfileEditForm(userId: string): UseFormReturn<ProfileForm> {
  return useForm<ProfileForm>({
    resolver: zodResolver(profileSchema),
    defaultValues: async () => {
      const user = await getUserProfile(userId);
      return getInitialProfile(user);
    },
    mode: "onSubmit",
  });
}
```

### 6) Field Array Identity Safety

Use `field.id` as key and append complete objects only.

```tsx
const { fields, append, remove } = useFieldArray({ control, name: "items" });

{
  fields.map((field, index) => (
    <div key={field.id}>
      <input {...register(`items.${index}.sku`)} />
      <button type="button" onClick={() => remove(index)}>
        Remove
      </button>
    </div>
  ));
}

<button type="button" onClick={() => append(getInitialCartItem())}>
  Add
</button>;
```

## Never Do This

- Never call `watch()` without args in the root form by default. Reason: it subscribes the root to everything and
  amplifies re-renders.

- Never mix `register()` and `useController` for the same field. Reason: duplicate registration creates conflicting
  state ownership.

- Never build Zod schemas inside components. Reason: resolver cache is invalidated and validation cost spikes.

- Never use array index as React key in `useFieldArray` lists. Reason: reorder/remove operations can corrupt
  item-field association.

- Never put DTO/API contracts in Presentation forms. Reason: it leaks infrastructure concerns and breaks layering
  boundaries.

- Never enable `shouldUnregister: true` by default in wizard-like forms. Reason: step transitions unmount fields and
  silently drop values the user expects to persist.

- Never chain array mutations like `append()` and `remove()` in the same synchronous handler. Reason: RHF internal
  item identity can shift mid-tick, producing hard-to-reproduce row/value mismatch.

## Decision Matrix

| Problem                    | First Check                                            | Fallback                                                   |
| -------------------------- | ------------------------------------------------------ | ---------------------------------------------------------- |
| Typing lag in big form     | Root-level `watch()` or broad `formState` subscription | Move watchers to leaf + use `useFormState`/`getFieldState` |
| Controlled UI not updating | `onChange`/`value` mapping in `useController`          | Wrap library component in dedicated adapter                |
| Form hydration race        | `useEffect + reset` pattern                            | Replace with async `defaultValues`                         |
| Array rows losing values   | `key={index}` or partial `append` object               | Switch to `field.id` and complete defaults                 |

## Common Failure Modes

| Symptom                                       | Likely Cause                                                  | Recommended Fix                                                     |
| --------------------------------------------- | ------------------------------------------------------------- | ------------------------------------------------------------------- |
| First change is missed in dependent UI        | `useWatch` subscription established after an early `setValue` | Pair `useWatch` with `getValues` for initial read, then subscribe   |
| Wizard step values disappear                  | `shouldUnregister: true` on multi-step forms                  | Keep `shouldUnregister` disabled for wizard flows                   |
| Numeric field flips to `NaN`                  | Empty string passed through `valueAsNumber`                   | Normalize empty input before `onChange` coercion                    |
| Switching entity ID does not refresh defaults | Assuming async `defaultValues` re-runs automatically          | Trigger explicit `reset(nextDefaults)` when entity identity changes |

## Minimal End-to-End Pattern

```ts
// Domain
export const createProductSchema = z.object({
  name: z.string().min(1),
  price: z.number().nonnegative(),
});

export function getInitialCreateProduct(): z.infer<typeof createProductSchema> {
  return { name: "", price: 0 };
}

// Application
export function useCreateProductForm(): UseFormReturn<CreateProductForm> {
  return useForm<CreateProductForm>({
    resolver: zodResolver(createProductSchema),
    defaultValues: getInitialCreateProduct(),
    mode: "onSubmit",
  });
}
```

```tsx
// Presentation
export function CreateProductPage() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useCreateProductForm();

  const onSubmit: SubmitHandler<CreateProductForm> = async (data) => {
    await createProduct(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input {...register("name")} />
      {errors.name?.message}
      <input type="number" {...register("price", { valueAsNumber: true })} />
      {errors.price?.message}
      <button disabled={isSubmitting}>Save</button>
    </form>
  );
}
```

## Commands

Use VS Code native search (`#tool:search`) with these patterns:

- Dangerous root subscriptions: `query: watch\(\)` (regex), path: `src`
- Index keys in field arrays: `query: key=\{index\}` (regex), path: `src`
- Broad `formState` usage in hot components: `query: formState`, path: `src`

## Resources

- Performance and subscriptions: `references/performance.md`
- UI-library integration: `references/integration.md`
- Dynamic arrays: `references/field-arrays.md`
- Zod schema guidance: use the `ghcopilot-hub-zod` skill
