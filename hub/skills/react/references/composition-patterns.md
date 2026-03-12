# Composition Patterns

Advanced React composition patterns for building flexible, maintainable components. Avoid boolean prop proliferation by using compound components, lifting state, and composing internals.

## Load Scope & Quick Navigation

Load this file when the user asks about compound components, provider boundaries, context contracts, or boolean-prop explosion.

Do NOT load this file for effect dependency bugs or compiler/memoization analysis.

Quick navigation:

- Too many variant booleans → [Avoid Boolean Prop Proliferation](#avoid-boolean-prop-proliferation)
- Shared context architecture → [Compound Components with Shared Context](#compound-components-with-shared-context)
- Provider abstraction/DI via interface → [Generic Context Interface for Dependency Injection](#generic-context-interface-for-dependency-injection)

## Avoid Boolean Prop Proliferation

**Impact: CRITICAL**

Don't add boolean props like `isThread`, `isEditing`, `isDMThread` to customize component behavior. Each boolean doubles possible states and creates unmaintainable conditional logic.

```tsx
// ❌ NEVER: Boolean props create exponential complexity
function Composer({
  onSubmit,
  isThread,
  channelId,
  isDMThread,
  dmId,
  isEditing,
  isForwarding,
}: Props) {
  return (
    <form>
      <Header />
      <Input />
      {isDMThread ? (
        <AlsoSendToDMField id={dmId} />
      ) : isThread ? (
        <AlsoSendToChannelField id={channelId} />
      ) : null}
      {isEditing ? (
        <EditActions />
      ) : isForwarding ? (
        <ForwardActions />
      ) : (
        <DefaultActions />
      )}
      <Footer onSubmit={onSubmit} />
    </form>
  );
}
```

```tsx
// ✅ ALWAYS: Explicit variants - each is self-documenting
function ThreadComposer({ channelId }: { channelId: string }) {
  return (
    <ThreadProvider channelId={channelId}>
      <Composer.Frame>
        <Composer.Input />
        <AlsoSendToChannelField channelId={channelId} />
        <Composer.Footer>
          <Composer.Formatting />
          <Composer.Submit />
        </Composer.Footer>
      </Composer.Frame>
    </ThreadProvider>
  );
}

function EditMessageComposer({ messageId }: { messageId: string }) {
  return (
    <EditMessageProvider messageId={messageId}>
      <Composer.Frame>
        <Composer.Input />
        <Composer.Footer>
          <Composer.CancelEdit />
          <Composer.SaveEdit />
        </Composer.Footer>
      </Composer.Frame>
    </EditMessageProvider>
  );
}
```

Each variant is explicit about what provider/state it uses, what UI elements it includes, and what actions are available. No boolean prop combinations to reason about.

---

## Compound Components with Shared Context

**Impact: HIGH**

Structure complex components as compound components with a shared context. Each subcomponent accesses shared state via context, not props.

```tsx
import { ReactNode, createContext, use, useState } from 'react';

// Define context interface with state, actions, meta
interface ComposerState {
  input: string;
  attachments: Attachment[];
  isSubmitting: boolean;
}

interface ComposerActions {
  update: (updater: (state: ComposerState) => ComposerState) => void;
  submit: () => void;
}

interface ComposerMeta {
  inputRef: React.RefObject<HTMLTextAreaElement>;
}

interface ComposerContextValue {
  state: ComposerState;
  actions: ComposerActions;
  meta: ComposerMeta;
}

const ComposerContext = createContext<ComposerContextValue | null>(null);

function useComposer() {
  const context = use(ComposerContext);
  if (!context) {
    throw new Error(
      'Composer components must be used within <Composer.Provider>'
    );
  }
  return context;
}
```

```tsx
// Provider component
function ComposerProvider({
  children,
  state,
  actions,
  meta,
}: {
  children: ReactNode;
  state: ComposerState;
  actions: ComposerActions;
  meta: ComposerMeta;
}) {
  return (
    <ComposerContext.Provider value={{ state, actions, meta }}>
      {children}
    </ComposerContext.Provider>
  );
}

// Subcomponents consume context
function ComposerFrame({ children }: { children: ReactNode }) {
  return <form className="flex flex-col gap-2">{children}</form>;
}

function ComposerInput() {
  const { state, actions, meta } = useComposer();
  return (
    <textarea
      ref={meta.inputRef}
      value={state.input}
      onChange={(e) => actions.update((s) => ({ ...s, input: e.target.value }))}
    />
  );
}

function ComposerSubmit() {
  const { actions, state } = useComposer();
  return (
    <button onClick={actions.submit} disabled={state.isSubmitting}>
      Send
    </button>
  );
}

// Export as compound component
const Composer = {
  Provider: ComposerProvider,
  Frame: ComposerFrame,
  Input: ComposerInput,
  Submit: ComposerSubmit,
  Header: ComposerHeader,
  Footer: ComposerFooter,
  Formatting: ComposerFormatting,
  Emojis: ComposerEmojis,
};
```

---

## Generic Context Interface for Dependency Injection

**Impact: HIGH**

Define a generic interface with `state`, `actions`, and `meta`. This enables the same UI components to work with different state implementations.

```tsx
// UI component only knows the interface, not the implementation
function ComposerInput() {
  const { state, actions, meta } = useComposer();

  // Works with ANY provider that implements the interface
  return (
    <textarea
      ref={meta.inputRef}
      value={state.input}
      onChange={(e) => actions.update((s) => ({ ...s, input: e.target.value }))}
    />
  );
}
```

```tsx
// Provider A: Local state for ephemeral forms
function ForwardMessageProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState(initialState);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const submit = useForwardMessage();

  return (
    <Composer.Provider
      state={state}
      actions={{ update: setState, submit }}
      meta={{ inputRef }}
    >
      {children}
    </Composer.Provider>
  );
}

// Provider B: Global synced state (Zustand) for channels
function ChannelProvider({
  channelId,
  children,
}: {
  channelId: string;
  children: ReactNode;
}) {
  const { state, update, submit } = useChannelStore(channelId);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  return (
    <Composer.Provider
      state={state}
      actions={{ update, submit }}
      meta={{ inputRef }}
    >
      {children}
    </Composer.Provider>
  );
}
```

The same `Composer.Input` works with both providers. Swap the provider, keep the UI.

---

## Lift State into Providers

**Impact: HIGH**

Move state into provider components so siblings outside the main UI can access and modify it.

```tsx
// ❌ PROBLEM: State trapped inside component
function ForwardMessageDialog() {
  return (
    <Dialog>
      <ForwardMessageComposer />
      <MessagePreview /> {/* How does this access composer state? */}
      <DialogActions>
        <ForwardButton /> {/* How does this call submit? */}
      </DialogActions>
    </Dialog>
  );
}
```

```tsx
// ✅ SOLUTION: State lifted to provider
function ForwardMessageDialog() {
  return (
    <ForwardMessageProvider>
      <Dialog>
        <Composer.Frame>
          <Composer.Input placeholder="Add a message..." />
          <Composer.Footer>
            <Composer.Formatting />
            <Composer.Emojis />
          </Composer.Footer>
        </Composer.Frame>

        {/* Custom UI OUTSIDE the composer, but INSIDE the provider */}
        <MessagePreview />

        <DialogActions>
          <CancelButton />
          <ForwardButton />
        </DialogActions>
      </Dialog>
    </ForwardMessageProvider>
  );
}

// Button lives OUTSIDE Composer.Frame but can still submit!
function ForwardButton() {
  const { actions } = useComposer();
  return <button onClick={actions.submit}>Forward</button>;
}

// Preview lives OUTSIDE Composer.Frame but can read state!
function MessagePreview() {
  const { state } = useComposer();
  return <Preview message={state.input} attachments={state.attachments} />;
}
```

**Key insight:** Components that need shared state don't have to be visually nested—they just need to be within the same provider.

---

## Decouple State Management from UI

**Impact: MEDIUM**

The provider is the only place that knows how state is managed. UI components consume the context interface—they don't know if state comes from `useState`, Zustand, or TanStack Query.

```tsx
// ❌ NEVER: UI coupled to state implementation
function ChannelComposer({ channelId }: { channelId: string }) {
  // UI component knows about global state implementation
  const state = useGlobalChannelState(channelId);
  const { submit, updateInput } = useChannelSync(channelId);

  return (
    <Composer.Frame>
      <Composer.Input value={state.input} onChange={updateInput} />
      <Composer.Submit onPress={submit} />
    </Composer.Frame>
  );
}
```

```tsx
// ✅ ALWAYS: State management isolated in provider
function ChannelProvider({
  channelId,
  children,
}: {
  channelId: string;
  children: ReactNode;
}) {
  // Provider handles all state management details
  const { state, update, submit } = useGlobalChannel(channelId);
  const inputRef = useRef(null);

  return (
    <Composer.Provider
      state={state}
      actions={{ update, submit }}
      meta={{ inputRef }}
    >
      {children}
    </Composer.Provider>
  );
}

// UI component only knows about the context interface
function ChannelComposer() {
  return (
    <Composer.Frame>
      <Composer.Input />
      <Composer.Footer>
        <Composer.Submit />
      </Composer.Footer>
    </Composer.Frame>
  );
}

// Usage
function Channel({ channelId }: { channelId: string }) {
  return (
    <ChannelProvider channelId={channelId}>
      <ChannelComposer />
    </ChannelProvider>
  );
}
```

---

## Base Component Variants

Create variants by extending a base component. Follows Open/Closed principle.

```tsx
import { ComponentProps, ElementType } from 'react';

import { cn } from '@/presentation/shared/lib/utils';

type ButtonBaseProps<T extends ElementType = 'button'> = {
  as?: T;
  className?: string;
} & ComponentProps<T>;

function ButtonBase<T extends ElementType = 'button'>({
  as,
  className,
  ...props
}: ButtonBaseProps<T>) {
  const Element = as ?? 'button';
  return (
    <Element
      className={cn(
        'inline-flex items-center justify-center rounded-md font-medium transition-colors',
        'focus-visible:ring-2 focus-visible:outline-none',
        'disabled:pointer-events-none disabled:opacity-50',
        className
      )}
      {...props}
    />
  );
}
```

```tsx
// Solid variant - open for extension
const solidVariants = {
  primary: 'bg-blue-600 text-white hover:bg-blue-700',
  secondary: 'bg-gray-600 text-white hover:bg-gray-700',
  danger: 'bg-red-600 text-white hover:bg-red-700',
} as const;

type ButtonSolidProps = ButtonBaseProps & {
  variant?: keyof typeof solidVariants;
};

function ButtonSolid({
  variant = 'primary',
  className,
  ...props
}: ButtonSolidProps) {
  return (
    <ButtonBase
      className={cn('px-4 py-2', solidVariants[variant], className)}
      {...props}
    />
  );
}
```

---

## Children Over Render Props

Use `children` for composition instead of `renderX` props. Children are more readable and compose naturally.

```tsx
// ❌ NEVER: Render props are awkward
function Composer({
  renderHeader,
  renderFooter,
  renderActions,
}: {
  renderHeader?: () => ReactNode;
  renderFooter?: () => ReactNode;
  renderActions?: () => ReactNode;
}) {
  return (
    <form>
      {renderHeader?.()}
      <Input />
      {renderFooter?.()}
      {renderActions?.()}
    </form>
  );
}

// Usage is awkward
<Composer
  renderHeader={() => <CustomHeader />}
  renderFooter={() => (
    <>
      <Formatting />
      <Emojis />
    </>
  )}
/>;
```

```tsx
// ✅ ALWAYS: Children compose naturally
function ComposerFrame({ children }: { children: ReactNode }) {
  return <form>{children}</form>;
}

function ComposerFooter({ children }: { children: ReactNode }) {
  return <footer className="flex gap-2">{children}</footer>;
}

// Usage is clean
<Composer.Frame>
  <CustomHeader />
  <Composer.Input />
  <Composer.Footer>
    <Composer.Formatting />
    <Composer.Emojis />
    <SubmitButton />
  </Composer.Footer>
</Composer.Frame>;
```

**When render props are OK:** When the parent needs to pass data to the child.

```tsx
// Render props work for data-passing scenarios
<List
  data={items}
  renderItem={({ item, index }) => <Item item={item} index={index} />}
/>
```

---

## Encapsulation with Specific Props

Don't pass entire objects when component only needs specific fields.

```tsx
// ❌ Component knows too much
function UserCard({ user }: { user: User }) {
  const name = user.name;
  const lastName = user.lastName;
  const theme = user.preferences.theme; // Deep access
}

// ✅ Component receives only what it needs
type UserCardProps = {
  name: string;
  lastName: string;
  theme: Theme;
};

function UserCard({ name, lastName, theme }: UserCardProps) {
  // Component is decoupled from User structure
}
```

Alternative with a ViewModel:

```tsx
type UserCardViewModel = {
  fullName: string;
  theme: Theme;
};

function createUserCardViewModel(user: User): UserCardViewModel {
  return {
    fullName: `${user.name} ${user.lastName}`,
    theme: user.preferences.theme,
  };
}

function UserCard({ viewModel }: { viewModel: UserCardViewModel }) {
  return <div className={viewModel.theme}>{viewModel.fullName}</div>;
}
```
