# Supabase Rules

## Client
```typescript
import { createClient } from '@supabase/supabase-js';
import type { Database } from 'src/types/supabase';
export const supabase = createClient<Database>(URL, ANON_KEY);
```

## Queries
```typescript
const { data, error } = await supabase
  .from('bookings')
  .select('id, status, physio_profiles(full_name)')
  .eq('patient_id', userId);
if (error) throw new Error(error.message);
```
- Always `{ data, error }` — never ignore error
- Never `select('*')` — name the columns
- Chain `.order()` `.limit()` to prevent over-fetching

## Auth
- `onAuthStateChange` in `app/_layout.tsx` → updates Zustand store
- Role from `users.role` after `getUser()` — not from JWT

## RLS — Every Table
```sql
ALTER TABLE t ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owner only" ON t FOR ALL USING (auth.uid() = user_id);
```

## Edge Functions
- `SUPABASE_SERVICE_ROLE_KEY` → `Deno.env.get()` only — never in app
- No `console.log` with user data
- Return proper HTTP status codes

## Migrations
- Naming: `YYYYMMDDHHMMSS_description.sql`
- Never modify existing migrations — add new ones
- Test: `supabase db reset` before commit

## Storage
```typescript
// Upload
await supabase.storage.from('avatars').upload(`${userId}/avatar.jpg`, file, { upsert: true });
// URL
const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(`${userId}/avatar.jpg`);
```

## Learned in Practice
<!-- /update-skill appends here -->
