# Effects Patterns

Advanced patterns for React Effects, dependencies, and cleanup.

## Load Scope & Quick Navigation

Load this file when the user asks about `useEffect` dependencies, reconnect loops, cleanup patterns, or `useEffectEvent` behavior.

Do NOT load this file for pure memoization/compiler questions or composition-only architecture tasks.

Quick navigation:

- Before deciding on `useEffect` → [Before Writing useEffect](#before-writing-useeffect)
- Dependency drift / linter suppression → [Effect Dependencies](#effect-dependencies)
- Non-reactive effect logic / `useEffectEvent` → [useEffectEvent for Non-Reactive Logic](#useeffectevent-for-non-reactive-logic)
- Subscription/timer cleanup → [Effect Cleanup](#effect-cleanup)

## Before Writing useEffect

Every time you are about to write `useEffect`, stop and ask:

**Is this syncing with an external system?**

External systems include WebSocket connections, browser APIs such as `IntersectionObserver` and `navigator.onLine`,
third-party libraries, DOM measurements, timers, and other subscriptions that exist outside React.

Not external systems: props, state, derived values, and user events.

Check each case before writing the Effect:

1. **Transforming data?** → Compute inline during render. Use `useMemo` only when the work is expensive.
2. **Responding to a user event?** → Put the logic in the event handler.
3. **Resetting state on prop change?** → Use the `key` prop.
4. **Fetching data?** → In SPAs, prefer TanStack Query. In RSC frameworks such as Next.js App Router, fetch on the server first. If `useEffect` is unavoidable in a client boundary, add cleanup.
5. **Notifying a parent?** → Call the callback in the event handler.
6. **Chaining effects?** → Move the cascade into one event handler or one update path.
7. **Subscribing to external store state?** → Use `useSyncExternalStore`.

If none of those cases apply and the answer is still genuinely "yes, external system," then `useEffect` is correct.

## Rules

- NEVER write `useEffect(() => setSomething(derived), [dep])`
- NEVER use `useEffect` for click, submit, change, or other user events
- NEVER use `useEffect` to reset state without considering the `key` prop first
- NEVER default to client-side `useEffect` fetching when the framework already provides a server fetch surface
- ALWAYS add cleanup when subscribing to external systems
- ALWAYS name effect functions for readability

## Effect Dependencies

### Never Suppress the Linter

```tsx
// ❌ NEVER: Suppressing linter hides bugs
useEffect(() => {
  const id = setInterval(() => {
    setCount(count + increment);
  }, 1000);
  return () => clearInterval(id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, []);

// ✅ ALWAYS: Fix the code, use updater function
useEffect(() => {
  const id = setInterval(() => {
    setCount((c) => c + increment);
  }, 1000);
  return () => clearInterval(id);
}, [increment]);
```

### Use Updater Functions to Remove State Dependencies

```tsx
// ❌ BUG: messages in dependencies causes reconnection on every message
useEffect(() => {
  connection.on("message", (msg) => {
    setMessages([...messages, msg]);
  });
  // ...
}, [messages]); // Reconnects on every message!

// ✅ FIX: Updater function removes dependency
useEffect(() => {
  connection.on("message", (msg) => {
    setMessages((msgs) => [...msgs, msg]);
  });
  // ...
}, []); // No messages dependency needed
```

### Move Objects/Functions Inside Effects

```tsx
// ❌ BUG: Object created each render triggers Effect
function ChatRoom({ roomId }: { roomId: string }) {
  const options = { serverUrl, roomId }; // New object each render

  useEffect(() => {
    const connection = createConnection(options);
    connection.connect();
    return () => connection.disconnect();
  }, [options]); // Reconnects every render!
}

// ✅ FIX: Create object inside Effect
function ChatRoom({ roomId }: { roomId: string }) {
  useEffect(() => {
    const options = { serverUrl, roomId };
    const connection = createConnection(options);
    connection.connect();
    return () => connection.disconnect();
  }, [roomId, serverUrl]); // Only reconnects when values change
}
```

### Name Effect Functions

When the Effect body has setup and teardown work, prefer a named function expression so the intent is visible in
stack traces and code review.

```tsx
useEffect(function syncOnlineStatus() {
  function handleStatusChange() {
    setIsOnline(navigator.onLine);
  }

  window.addEventListener("online", handleStatusChange);
  window.addEventListener("offline", handleStatusChange);

  return function cleanupOnlineStatus() {
    window.removeEventListener("online", handleStatusChange);
    window.removeEventListener("offline", handleStatusChange);
  };
}, []);
```

---

## useEffectEvent for Non-Reactive Logic

Requires runtime/tooling support for `useEffectEvent`.

Fallback when unavailable:

- Keep dependency-safe Effects and move unstable logic to event boundaries when possible.
- For subscription callbacks, use a ref bridge to read latest values without forcing reconnects.

```tsx
// Fallback pattern: ref bridge for latest value
function ChatRoom({ roomId, theme }: ChatRoomProps) {
  const themeRef = useRef(theme);

  useEffect(() => {
    themeRef.current = theme;
  }, [theme]);

  useEffect(() => {
    const connection = createConnection(serverUrl, roomId);
    connection.on("connected", () => {
      showNotification("Connected!", themeRef.current);
    });
    connection.connect();
    return () => connection.disconnect();
  }, [roomId]);
}
```

When you need to read a value without it being a dependency:

```tsx
// ❌ PROBLEM: theme change reconnects chat
function ChatRoom({ roomId, theme }: ChatRoomProps) {
  useEffect(() => {
    const connection = createConnection(serverUrl, roomId);
    connection.on("connected", () => {
      showNotification("Connected!", theme);
    });
    connection.connect();
    return () => connection.disconnect();
  }, [roomId, theme]); // Reconnects on theme change!
}

// ✅ FIX: useEffectEvent for non-reactive logic
function ChatRoom({ roomId, theme }: ChatRoomProps) {
  const onConnected = useEffectEvent(() => {
    showNotification("Connected!", theme);
  });

  useEffect(() => {
    const connection = createConnection(serverUrl, roomId);
    connection.on("connected", () => {
      onConnected();
    });
    connection.connect();
    return () => connection.disconnect();
  }, [roomId]); // theme no longer causes reconnection
}
```

### Wrap Callback Props with useEffectEvent

```tsx
// ❌ PROBLEM: Callback prop in dependencies
function ChatRoom({ roomId, onReceiveMessage }: ChatRoomProps) {
  useEffect(() => {
    connection.on("message", onReceiveMessage);
    // ...
  }, [roomId, onReceiveMessage]); // Reconnects if parent re-renders
}

// ✅ FIX: Wrap callback in useEffectEvent
function ChatRoom({ roomId, onReceiveMessage }: ChatRoomProps) {
  const onMessage = useEffectEvent(onReceiveMessage);

  useEffect(() => {
    connection.on("message", onMessage);
    // ...
  }, [roomId]); // Stable dependency list
}
```

---

## Effect Cleanup

### Always Clean Up Subscriptions

```tsx
// Connection
useEffect(() => {
  const connection = createConnection(serverUrl, roomId);
  connection.connect();
  return () => connection.disconnect(); // REQUIRED
}, [roomId]);

// Event listener
useEffect(() => {
  function handleScroll(e: Event) {
    console.log(window.scrollY);
  }
  window.addEventListener("scroll", handleScroll);
  return () => window.removeEventListener("scroll", handleScroll); // REQUIRED
}, []);

// Interval
useEffect(() => {
  const id = setInterval(() => {
    // ...
  }, 1000);
  return () => clearInterval(id); // REQUIRED
}, []);
```

### Data Fetching with Ignore Flag

Prevent stale data from old requests:

```tsx
useEffect(() => {
  let ignore = false;

  async function fetchData() {
    const result = await fetchTodos(userId);
    if (!ignore) {
      setTodos(result);
    }
  }

  fetchData();

  return () => {
    ignore = true; // Prevents setting state from stale request
  };
}, [userId]);
```

**Note**: In SPAs, prefer TanStack Query over manual fetching. In Next.js App Router or other RSC setups, prefer server-side fetching before reaching for client Effects. This pattern is for rare client-only fallbacks.

## useSyncExternalStore for External Store State

If the problem is subscribing to state that lives outside React, reach for `useSyncExternalStore` instead of wiring a
`useEffect` plus `setState` pair by hand.

```tsx
import { useSyncExternalStore } from "react";

function subscribe(callback: () => void) {
  window.addEventListener("online", callback);
  window.addEventListener("offline", callback);

  return function unsubscribe() {
    window.removeEventListener("online", callback);
    window.removeEventListener("offline", callback);
  };
}

function getSnapshot() {
  return navigator.onLine;
}

function getServerSnapshot() {
  return true;
}

export function useOnlineStatus() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
```

Use this pattern for browser-backed store state, custom stores, and any subscribe/getSnapshot source that should stay
consistent with concurrent rendering.

### Development Double-Fire Is Intentional

React remounts components in development to verify cleanup works. Don't prevent it with refs:

```tsx
// ❌ NEVER: Hiding the symptom
const didInit = useRef(false);
useEffect(() => {
  if (didInit.current) return;
  didInit.current = true;
  // ...
}, []);

// ✅ ALWAYS: Fix the cleanup
useEffect(() => {
  const connection = createConnection();
  connection.connect();
  return () => connection.disconnect(); // Proper cleanup
}, []);
```

---

## Notifying Parent of State Changes

Don't use Effects to notify parents:

```tsx
// ❌ NEVER: Effect to notify parent
function Toggle({ onChange }: { onChange: (isOn: boolean) => void }) {
  const [isOn, setIsOn] = useState(false);

  useEffect(() => {
    onChange(isOn);
  }, [isOn, onChange]);
}

// ✅ BETTER: Update both in event handler
function Toggle({ onChange }: { onChange: (isOn: boolean) => void }) {
  const [isOn, setIsOn] = useState(false);

  function updateToggle(nextIsOn: boolean) {
    setIsOn(nextIsOn);
    onChange(nextIsOn);
  }
}

// ✅ BEST: Fully controlled component
function Toggle({ isOn, onChange }: { isOn: boolean; onChange: (isOn: boolean) => void }) {
  function handleClick() {
    onChange(!isOn);
  }
}
```

---

## Chains of Effects

Avoid Effect chains that trigger each other:

```tsx
// ❌ NEVER: Effect chain
useEffect(() => {
  if (card !== null && card.gold) {
    setGoldCardCount((c) => c + 1);
  }
}, [card]);

useEffect(() => {
  if (goldCardCount > 3) {
    setRound((r) => r + 1);
    setGoldCardCount(0);
  }
}, [goldCardCount]);

// ✅ ALWAYS: Calculate derived state, update in event handler
const isGameOver = round > 5;

function handlePlaceCard(nextCard: Card) {
  setCard(nextCard);
  if (nextCard.gold) {
    if (goldCardCount < 3) {
      setGoldCardCount(goldCardCount + 1);
    } else {
      setGoldCardCount(0);
      setRound(round + 1);
    }
  }
}
```

---

## Refs Advanced Patterns

### Ref Callbacks for Dynamic Lists

```tsx
// ❌ NEVER: Can't call useRef in a loop
{
  items.map((item) => {
    const ref = useRef(null); // Rule violation!
    return <li ref={ref} />;
  });
}

// ✅ ALWAYS: Ref callback with Map
const itemsRef = useRef(new Map<string, HTMLLIElement>());

{
  items.map((item) => (
    <li
      key={item.id}
      ref={(node) => {
        if (node) {
          itemsRef.current.set(item.id, node);
        } else {
          itemsRef.current.delete(item.id);
        }
      }}
    />
  ));
}
```

### useImperativeHandle for Controlled Exposure

Limit what parent can access:

```tsx
import { forwardRef, useImperativeHandle, useRef } from "react";

type MyInputHandle = {
  focus: () => void;
};

const MyInput = forwardRef<MyInputHandle, InputProps>(function MyInput(props, ref) {
  const realInputRef = useRef<HTMLInputElement>(null);

  useImperativeHandle(ref, () => ({
    focus() {
      realInputRef.current?.focus();
    },
    // Parent can ONLY call focus(), not access full DOM node
  }));

  return <input ref={realInputRef} {...props} />;
});
```

---

## flushSync for Synchronous DOM Updates

When you need to read DOM immediately after state update:

```tsx
import { flushSync } from "react-dom";

function handleAdd() {
  flushSync(() => {
    setTodos([...todos, newTodo]);
  });
  // DOM is now updated, safe to read
  listRef.current?.lastChild?.scrollIntoView();
}
```

**Use sparingly** - this opts out of React's batching optimizations.
