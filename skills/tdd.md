# TDD / Jest Skills

Patterns and lessons for testing React Native hooks and modules with Jest.

---

## Learned in Practice

### Mocking module boolean properties that must change between tests
**Problem:** `jest.mock('expo-device', () => mockDevice)` + mutating `mockDevice.isDevice` in `beforeEach` has no effect inside the tested module.
**Root cause:** Babel's `_interopRequireWildcard` creates a new namespace object and copies plain value properties (e.g., `isDevice: true`) as snapshots. Mutating `mockDevice.isDevice` after module load changes the original object but not the copied namespace that the module holds.
**Fix / Rule:** Define `isDevice` as a getter in the factory. Babel copies the getter descriptor (not the value), so the getter closure — which reads from a `let` variable — stays live across tests.
**Example:**
```typescript
// wrong — isDevice is snapshot-copied, mutation has no effect
const mockDevice = { isDevice: true };
jest.mock('expo-device', () => mockDevice);
beforeEach(() => { mockDevice.isDevice = true; }); // no-op inside tested module

// correct — getter is copied, variable change is seen by tested module
let mockIsDevice = true;
jest.mock('expo-device', () => ({
  get isDevice() { return mockIsDevice; },
}));
beforeEach(() => { mockIsDevice = true; });
// In test: mockIsDevice = false;
```

### Chainable Supabase query builder mock
**Problem:** Supabase's fluent builder (`.from().select().eq().order()`) can't be mocked with a simple `jest.fn()` — intermediate calls need to return an object that is also awaitable.
**Root cause:** Jest mocks return `undefined` by default; chained methods need a common object with `then` for direct `await`.
**Fix / Rule:** Build a `qb()` helper that creates a plain object with jest mocks for each method (`mockReturnValue(chain)`), adds `then` as a property that delegates to `Promise.resolve(result)`, and optionally overrides `.single()` with `mockResolvedValue(result)`.
**Example:**
```typescript
function qb(result: { data: unknown; error: unknown }) {
  const p = Promise.resolve(result);
  const chain: Record<string, unknown> = {};
  ['select', 'eq', 'order', 'insert', 'update'].forEach((m) => {
    chain[m] = jest.fn().mockReturnValue(chain);
  });
  chain.single = jest.fn().mockResolvedValue(result);
  chain.then = (res: (v: unknown) => unknown, rej?: (e: unknown) => unknown) =>
    p.then(res, rej);
  return chain;
}
// Usage:
mockFrom.mockReturnValue(qb({ data: [...], error: null }));
```

### Wrapping refetch in act()
**Problem:** Calling `result.current.refetch()` directly in a hook test logs `act()` warnings because `setFetchKey` triggers a state update outside of React's test act boundary.
**Fix / Rule:** Always wrap `refetch()` (or any function that triggers state) in `act(() => { ... })` from RNTL before asserting on subsequent state.
```typescript
act(() => { result.current.refetch(); });
await waitFor(() => expect(mockRpc).toHaveBeenCalledTimes(2));
```

### Use clearAllMocks (not resetAllMocks) with full beforeEach setup
**Problem:** `jest.resetAllMocks()` removes mock implementations set by `mockResolvedValue`/`mockReturnValue`. Tests that rely on mock implementations from `beforeEach` unexpectedly return `undefined`.
**Fix / Rule:** Use `jest.clearAllMocks()` (clears call history only) and set all needed implementations in `beforeEach` after the clear. This gives each test a clean call history plus a ready happy-path mock state.
