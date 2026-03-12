# Reduce Looping

## Load Scope & Quick Navigation

Load this file when performance issues come from extra collection passes, repeated lookups, or nested iterations.

Do NOT load this file for branching structure redesign or type-modeling decisions.

Quick navigation:

- Collapse chained passes → [Chained Methods to Single Reduce](#chained-methods-to-single-reduce)
- Replace repeated O(n) checks → [Linear Search to O(1) Lookup](#linear-search-to-o1-lookup)
- Remove nested loop-side filtering → [Array Methods in Loops](#array-methods-in-loops)

## Issues

- Multiple passes over same array (`.map().filter().reduce()`)
- Unnecessary array creation (spreading, slicing)
- Array methods in loops
- Linear searches that could use Sets/Maps
- Incorrect collection type for access pattern

## Optimizations

- Combine multiple array operations into single pass
- Use index-based loops for performance-critical paths
- Replace O(n) lookups with O(1) using Set/Map
- Use typed arrays for numeric data
- Reuse arrays when function owns them (local scope, not returned/exposed)

## Examples

### Chained Methods to Single Reduce

**❌ Incorrect: two iterations**

```ts
const result = arr.filter(predicate).map(mapper);
```

**✅ Correct: single iteration**

```ts
const result = arr.reduce(
  (acc, curr) => (predicate(curr) ? [...acc, mapper(curr)] : acc),
  []
);
```

### Linear Search to O(1) Lookup

**❌ Incorrect: O(n)**

```ts
const keys = Object.keys(someObj);
if (keys.includes(id)) {
  /**/
}
```

**✅ Correct: O(1)**

```ts
const keys = new Set(Object.keys(someObj));
if (keys.has(id)) {
  /**/
}
```

### Array Methods in Loops

**❌ Incorrect: nested iterations**

```ts
for (const user of users) {
  const active = items.filter((item) => item.userId === user.id);
  process(active);
}
```

**✅ Correct: build lookup once**

```ts
const itemsByUser = new Map();
for (const item of items) {
  if (!itemsByUser.has(item.userId)) {
    itemsByUser.set(item.userId, []);
  }
  itemsByUser.get(item.userId).push(item);
}

for (const user of users) {
  const active = itemsByUser.get(user.id) || [];
  process(active);
}
```

### Build Index Maps for Repeated Lookups

**❌ Incorrect: (O(n) per lookup)**

```ts
function processOrders(orders: Order[], users: User[]) {
  return orders.map((order) => ({
    ...order,
    user: users.find((u) => u.id === order.userId),
  }));
}
```

**✅ Correct: (O(1) per lookup)**

```ts
function processOrders(orders: Order[], users: User[]) {
  const userById = new Map(users.map((u) => [u.id, u]));

  return orders.map((order) => ({
    ...order,
    user: userById.get(order.userId),
  }));
}
```

### Combine Multiple Array Iterations

> Multiple .filter() or .map() calls iterate the array multiple times. Combine into one loop.

**❌ Incorrect: 3 iterations**`

```ts
const admins = users.filter((u) => u.isAdmin);
const testers = users.filter((u) => u.isTester);
const inactive = users.filter((u) => !u.isActive);
```

**✅ Correct: 1 iteration**

```ts
const admins: User[] = [];
const testers: User[] = [];
const inactive: User[] = [];

for (const user of users) {
  if (user.isAdmin) admins.push(user);
  if (user.isTester) testers.push(user);
  if (!user.isActive) inactive.push(user);
}
```

### Unnecessary Array Creation

**❌ Incorrect: creates intermediate arrays**

```ts
const result = [...arr].slice(0, 10).map(transform);
```

**✅ Correct: process directly**

```ts
const result = [];
const len = Math.min(arr.length, 10);
for (let i = 0; i < len; i++) {
  result.push(transform(arr[i]));
}
```

### Index-Based Loops for Hot Paths

**❌ Incorrect: slower iteration**

```ts
for (const item of largeArray) {
  // performance-critical operation
  processPixel(item);
}
```

**✅ Correct: index-based**

```ts
const len = largeArray.length;
for (let i = 0; i < len; i++) {
  processPixel(largeArray[i]);
}
```

### Typed Arrays for Numeric Data

**❌ Incorrect: generic array**

```ts
const pixels = new Array(width * height);
for (let i = 0; i < pixels.length; i++) {
  pixels[i] = Math.random() * 255;
}
```

**✅ Correct: typed array**

```ts
const pixels = new Uint8Array(width * height);
for (let i = 0; i < pixels.length; i++) {
  pixels[i] = Math.random() * 255;
}
```
