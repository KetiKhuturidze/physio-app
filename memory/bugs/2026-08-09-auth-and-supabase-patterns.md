# Bug Patterns — 2026-08-09

## Pattern 1: handleLogout not awaiting signOut error

**Files affected:** app/(patient)/profile.tsx, app/(physio)/profile.tsx
**Root cause:** `await supabase.auth.signOut()` called without checking error. On failure, local Zustand state was cleared anyway, leaving a live JWT the user believes revoked.
**Fix:**
```ts
async function handleLogout() {
  setLoggingOut(true);
  try {
    const { error } = await supabase.auth.signOut();
    if (error) return; // show error to user if needed
    logout();
    router.replace('/(auth)/login');
  } finally {
    setLoggingOut(false);
  }
}
```
**Rule:** Always check signOut error. Only clear local state + navigate after confirmed success.

---

## Pattern 2: console.error leaking DB error objects

**Files affected:** profile-edit.tsx, review/[bookingId].tsx, useBookings.ts
**Root cause:** `console.error('[label]', supabaseError)` logs DB error objects that may contain table names, query details, or indirect user data.
**Fix:** Remove all console.error/log. Surface errors via UI state (`setError(S.saveError)`).
**Rule:** No console.log/error anywhere in the app. CLAUDE.md enforces this.

---

## Pattern 3: .single() used for existence checks

**File:** app/(physio)/profile-edit.tsx
**Root cause:** `.single()` was used to check if a `physio_profiles` row exists for a user. `.single()` throws PGRST116 when zero rows are found, meaning the error was silently ignored and could cause incorrect branching.
**Fix:** Use `.maybeSingle()` + explicit error check:
```ts
const { data: existing, error: existingError } = await supabase
  .from('physio_profiles').select('id').eq('user_id', user.id).maybeSingle();
if (existingError) { setError(...); return; }
// data is null = no row found (insert path), not an error
```
**Rule:** `.single()` = expect exactly 1 row (error otherwise). `.maybeSingle()` = 0 or 1 row OK.

---

## Pattern 4: Android INITIAL_SESSION query hang

**File:** app/_layout.tsx
**Root cause:** On Samsung/slow Android, `supabase.from('users').select(*)...single()` hangs indefinitely on INITIAL_SESSION. A 10s safety net timeout was already in place but users always waited 10s.
**Fix:** Add a 6s `Promise.race` timeout on the query itself so most slow-network cases resolve in 6s, with the 10s safety net as a last resort.
```ts
const timeoutPromise = new Promise<{ data: null; error: Error }>((resolve) =>
  setTimeout(() => resolve({ data: null, error: new Error('query timeout') }), 6000),
);
const { data, error } = await Promise.race([queryPromise, timeoutPromise]);
```
