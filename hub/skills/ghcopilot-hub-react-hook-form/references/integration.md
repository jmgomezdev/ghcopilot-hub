# Integration Reference (UI Libraries)

Load this file when wiring RHF with controlled or headless UI components (Shadcn/Radix, MUI, AntD, custom inputs).

## Integration Mindset

Treat every third-party input as an adapter problem:

- Application owns `useForm` and schema wiring.
- Presentation owns the component adapter.
- Adapter maps library event/value contract <-> RHF `field` contract.

If mapping is ambiguous, create a dedicated wrapper component instead of inlining custom wiring repeatedly.

## Adapter Contract Checklist

For any controlled component, verify all 4 mappings:

- `value`
- `onChange`
- `onBlur`
- `ref`

Missing one usually causes dirty/touched/validation inconsistencies.

## Shadcn / Radix Specifics

Key point: many controls expose `onValueChange`, not native `onChange`.

```tsx
<FormField
  control={control}
  name="role"
  render={({ field }) => (
    <Select value={field.value} onValueChange={field.onChange}>
      <SelectTrigger onBlur={field.onBlur} ref={field.ref} />
      <SelectContent>{/* options */}</SelectContent>
    </Select>
  )}
/>
```

Notes:

- Do not spread `field` blindly into components that are not input-compatible.
- Ensure the imported `Form` components are from your UI layer, not a conflicting package.

## MUI Specifics

MUI components can emit either event objects or direct values depending on component/version.

```tsx
<Controller
  control={control}
  name="amount"
  render={({ field, fieldState }) => (
    <TextField
      value={field.value}
      onChange={(e) => field.onChange(Number(e.target.value || 0))}
      onBlur={field.onBlur}
      inputRef={field.ref}
      error={!!fieldState.error}
      helperText={fieldState.error?.message}
    />
  )}
/>
```

Always normalize before calling `field.onChange` when the domain type is not string.

## Anti-Patterns

- Never double-register a field (`register` + `Controller/useController`).
  Reason: creates competing owners for the same value/touched/dirty lifecycle and leads to non-deterministic updates.

- Never spread conversion/parsing logic across many pages.
  Reason: numeric/date coercion drifts over time and creates inconsistent validation behavior per screen.
  Recovery: move coercion into one reusable adapter component per input family.

- Never hide library-specific event contracts behind ambiguous wrappers.
  Reason: maintainers assume native DOM `onChange`, then break touched/blur semantics when refactoring.

- Never omit `onBlur`/`ref` mapping when wiring controlled components.
  Reason: field may appear to work while touched tracking, focus management, and validation timing become incorrect.

## Verification Checklist

Prioritize behavioral checks over snapshots:

- Changing value updates RHF state.
- Blur marks field as touched.
- Validation messages appear/disappear correctly.
- Numeric/date parsing is stable for empty and invalid values.

## Useful Commands

Use VS Code native search (`#tool:search`) with these patterns:

- Controlled wrappers and `Controller` usage:
  `query: useController|<Controller` (regex), path: `src`
- Possible double registration smells:
  `query: register\(|name=\"` (regex), path: `src/presentation`
