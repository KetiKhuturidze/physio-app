# Supabase Skills

Patterns and lessons for working with Supabase in this project.

---

## Learned in Practice

### Supabase Storage uploads in React Native — use expo-file-system, not fetch + blob
**Problem:** Uploading to Supabase Storage via `fetch(uri)` → `response.blob()` → `supabase.storage.upload()` causes `StorageUnknownError: Network request failed` on physical iOS devices. Works fine in simulator but fails on device.

**Root cause:** React Native's `fetch` + `Blob` pipeline is unreliable for local file URIs when used with Supabase's internal upload path on device. The network layer throws before the request reaches Supabase.

**Fix / Rule:** Use `expo-file-system` to read the file as base64, then `base64-arraybuffer` to decode it to an `ArrayBuffer`, and upload the buffer directly. This bypasses `fetch` entirely.

**Example:**
```typescript
// wrong — causes StorageUnknownError: Network request failed on device
const response = await fetch(uri);
const blob = await response.blob();
await supabase.storage.from('avatars').upload(path, blob, { contentType: 'image/jpeg', upsert: true });

// correct
import * as FileSystem from 'expo-file-system';
import { decode } from 'base64-arraybuffer';

const base64 = await FileSystem.readAsStringAsync(uri, {
  encoding: FileSystem.EncodingType.Base64,
});
const arrayBuffer = decode(base64);
await supabase.storage.from('avatars').upload(path, arrayBuffer, { contentType: 'image/jpeg', upsert: true });
```

**Packages required:**
```bash
npx expo install expo-file-system
npm install base64-arraybuffer
```

---

### Supabase Storage public URLs — bucket `public` flag vs RLS policies are separate
**Problem:** `getPublicUrl()` returns a URL that returns 400/403 even when RLS SELECT policy allows public reads.

**Root cause:** `getPublicUrl()` uses the `/object/public/` path which only works when the bucket itself has `public = true` in `storage.buckets`. RLS SELECT policies only apply to authenticated reads via `/object/authenticated/`. The two systems are independent.

**Fix / Rule:** Run `UPDATE storage.buckets SET public = true WHERE id = 'avatars';` in the Supabase SQL editor. RLS policies can still restrict writes.

---

### Supabase join cast — use `as unknown as Type` for queries with FK joins
**Problem:** `data as MyType` fails TypeScript when the query includes a `.select()` with nested FK joins (e.g., `physio_service_areas(district_id)`). Supabase infers the joined fields as arrays or complex types that don't match the declared type directly.

**Fix / Rule:** Use `data as unknown as MyType` to bypass the intermediate inference.

```typescript
// wrong
const { data } = await supabase.from('physio_profiles').select('*, physio_service_areas(district_id)').single();
setProfile(data as ProfileRow); // TS error

// correct
setProfile(data as unknown as ProfileRow);
```

---

### Use check-then-update (not upsert) for physio_profiles
**Problem:** `supabase.from('physio_profiles').upsert({...})` fails or behaves incorrectly even when a `UNIQUE` constraint exists on `user_id`. RLS policies conflict with the upsert's internal SELECT + INSERT/UPDATE logic.

**Root cause:** PostgREST upsert requires the ability to SELECT existing rows to decide between insert and update. If RLS restricts SELECT in a way that returns 0 rows (e.g., `auth.uid() = user_id` but the row doesn't exist yet), the upsert may insert a duplicate or throw a constraint error.

**Fix / Rule:** Always do an explicit check-then-branch:
```typescript
// correct
const { data: existing } = await supabase
  .from('physio_profiles')
  .select('id')
  .eq('user_id', user.id)
  .single();

if (existing?.id) {
  await supabase.from('physio_profiles').update({...}).eq('user_id', user.id);
} else {
  await supabase.from('physio_profiles').insert({...});
}
```

---

### Profile completion checks must not reference removed DB columns
**Problem:** Dashboard showed "profile incomplete" for all physios after `hourly_rate` was removed from `physio_profiles`. The check itself didn't reference `hourly_rate`, but the SELECT query still fetched it — PostgREST returns an error for unknown columns, making `data` null, making `profile` null, making the check always fail.

**Root cause:** A stale column name in a `.select()` string causes a silent PostgREST error. There's no TypeScript error because Supabase query strings are untyped.

**Fix / Rule:** When removing a DB column, grep for its name in every `.select()` string across the codebase — not just in types and destructures. Also update any completion/validation logic that depends on it.

---

### React Native Image cache — append ?t=Date.now() after re-upload
**Problem:** After re-uploading an avatar to the same storage path, the `Image` component shows the old image because React Native caches by URL.

**Fix / Rule:** Append `?t=${Date.now()}` to the public URL after upload. Supabase Storage ignores unknown query params, but React Native treats it as a new URL and re-fetches.

```typescript
const { data } = supabase.storage.from('avatars').getPublicUrl(path);
return `${data.publicUrl}?t=${Date.now()}`;
```

---

### PostGIS district coordinates — always seed with ST_SetSRID or distance returns null
**Problem:** Distance calculations (`ST_Distance`, `ST_DWithin`) return `null` for districts even when coordinates look correct.

**Root cause:** `ST_MakePoint(lng, lat)` creates a geometry with SRID 0 (undefined). PostGIS can't compute distances between geometries with mismatched or undefined SRIDs.

**Fix / Rule:** Always wrap `ST_MakePoint` with `ST_SetSRID(..., 4326)` when seeding geography columns. Use `geography` cast if the column type is `geography`.

```sql
-- wrong — SRID 0, distance returns null
INSERT INTO districts (center) VALUES (ST_MakePoint(44.7833, 41.6941));

-- correct
INSERT INTO districts (center) VALUES (ST_SetSRID(ST_MakePoint(44.7833, 41.6941), 4326));
-- or with explicit geography cast
INSERT INTO districts (center) VALUES (ST_SetSRID(ST_MakePoint(44.7833, 41.6941), 4326)::geography);
```
