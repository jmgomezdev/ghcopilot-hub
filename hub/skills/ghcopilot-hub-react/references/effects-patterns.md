# Effects Patterns

Advanced patterns for React Effects, dependencies, and cleanup.

## Load Scope & Quick Navigation

Load this file when the user asks about `useEffect` dependencies, reconnect loops, cleanup patterns, or `useEffectEvent` behavior.

Do NOT load this file for pure memoization/compiler questions or composition-only architecture tasks.

Quick navigation:

- Dependency drift / linter suppression → [Effect Dependencies](#effect-dependencies)
- Non-reactive effect logic / `useEffectEvent` → [useEffectEvent for Non-Reactive Logic](#useeffectevent-for-non-reactive-logic)
- Subscription/timer cleanup → [Effect Cleanup](#effect-cleanup)

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

**Note**: Prefer TanStack Query over manual fetching. This pattern is for rare cases where you can't use Query.

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
