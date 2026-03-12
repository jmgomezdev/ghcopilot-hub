# Field Arrays Reference (`useFieldArray`)

Load this file when implementing dynamic rows/lists, reorder actions, or debugging value loss in array items.

## Invariants

- Use `field.id` as React key. Never use index.
- Append/prepend/insert complete objects, not partials.
- Keep one `useFieldArray` instance per `name`.
- Keep operations separated when state order can change.

These invariants protect RHF's internal item identity.

## Correct Baseline

```tsx
const { control, register } = useOrderForm();
const { fields, append, remove, move } = useFieldArray({
  control,
  name: 'items',
});

return (
  <>
    {fields.map((field, index) => (
      <div key={field.id}>
        <input {...register(`items.${index}.sku`)} />
        <input
          type="number"
          {...register(`items.${index}.qty`, { valueAsNumber: true })}
        />
        <button type="button" onClick={() => remove(index)}>
          Remove
        </button>
      </div>
    ))}

    <button type="button" onClick={() => append(getInitialOrderItem())}>
      Add item
    </button>
  </>
);
```

## Operation Semantics

| Operation                       | Safe Usage                     | Risk                                                               |
| ------------------------------- | ------------------------------ | ------------------------------------------------------------------ |
| `append` / `prepend` / `insert` | Provide full item defaults     | Partial objects break validation/state                             |
| `remove`                        | Trigger from isolated action   | Chaining with append in same tick can create confusing transitions |
| `move` / `swap`                 | Keep stable `field.id` keys    | Index keys corrupt mapping after reorder                           |
| `replace`                       | Prefer for full server re-sync | Can reset dirty/touched assumptions                                |

## Common Failure Modes

| Symptom                                  | Root Cause                                   | Fix                                                       |
| ---------------------------------------- | -------------------------------------------- | --------------------------------------------------------- |
| Values jump to another row after reorder | `key={index}`                                | Use `key={field.id}`                                      |
| New rows fail validation immediately     | Missing required properties in appended item | Use `getInitial*` full object                             |
| Nested arrays become unstable            | Multiple hooks controlling same path         | One `useFieldArray` per path and isolate child components |
| Row state lost with virtualization       | Rows unmount without persistent form context | Keep `FormProvider` context and verify mount strategy     |

## Nested Arrays Guidance

For nested paths, keep names explicit and typed where possible.

```tsx
const childArray = useFieldArray({
  control,
  name: `sections.${sectionIndex}.items` as const,
});
```

Use child row components so each level subscribes only to the path it renders.

## Never Do This

- Never key rows by index.
  Reason: after reorder/remove, React reuses DOM nodes for different RHF items and values appear to jump rows.

- Never append partial items.
  Reason: missing properties create mixed default/dirty state and validation behavior diverges between old and new rows.
  Recovery: append only `getInitial*()` full objects.

- Never share one array field name across multiple independent components.
  Reason: multiple controllers mutate the same path, causing race-like updates and unstable field registration order.

- Never execute `append` and `remove` for the same array in a single synchronous click handler.
  Reason: identity recalculation can happen between operations and produce intermittent row/state mismatch.
  Recovery: split into separate user actions or defer second mutation.

## Useful Commands

Use VS Code native search (`#tool:search`) with these patterns:

- Risky index keys:
  `query: key=\{index\}` (regex), path: `src`
- `useFieldArray` usage:
  `query: useFieldArray`, path: `src`
- `append(` calls that may use partials:
  `query: append\(` (regex), path: `src`
