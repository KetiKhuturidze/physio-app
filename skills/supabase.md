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

### React Native Image cache — append ?t=Date.now() after re-upload
**Problem:** After re-uploading an avatar to the same storage path, the `Image` component shows the old image because React Native caches by URL.

**Fix / Rule:** Append `?t=${Date.now()}` to the public URL after upload. Supabase Storage ignores unknown query params, but React Native treats it as a new URL and re-fetches.

```typescript
const { data } = supabase.storage.from('avatars').getPublicUrl(path);
return `${data.publicUrl}?t=${Date.now()}`;
```
