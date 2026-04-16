# React Native / Expo Skills

Patterns and lessons for React Native, Expo, NativeWind, and navigation in this project.

---

## Learned in Practice

### Supabase Storage uploads — use expo-file-system + base64-arraybuffer, not fetch + blob
**Problem:** `fetch(uri)` → `response.blob()` → `supabase.storage.upload()` causes `StorageUnknownError: Network request failed` on physical iOS devices. Works in simulator, fails on device.

**Root cause:** React Native's fetch + Blob pipeline is unreliable for local file URIs on device. The network layer throws before Supabase is reached.

**Fix / Rule:** Use `expo-file-system/legacy` to read as base64, decode with `base64-arraybuffer`, upload the ArrayBuffer directly.

**Example:**
```typescript
import * as FileSystem from 'expo-file-system/legacy';
import { decode } from 'base64-arraybuffer';

// wrong
const blob = await (await fetch(uri)).blob();
await supabase.storage.from('avatars').upload(path, blob, { upsert: true });

// correct
const base64 = await FileSystem.readAsStringAsync(uri, {
  encoding: FileSystem.EncodingType.Base64,
});
const arrayBuffer = decode(base64);
await supabase.storage.from('avatars').upload(path, arrayBuffer, {
  contentType: 'image/jpeg',
  upsert: true,
});
```

**Note:** Import from `expo-file-system/legacy` not `expo-file-system` — v19 moved `EncodingType` and `readAsStringAsync` to the legacy export path.

---

### react-native-url-polyfill/auto must be the first import in _layout.tsx
**Problem:** Supabase network requests fail or behave incorrectly without the URL polyfill loaded before anything else.

**Root cause:** React Native's JS engine lacks a compliant `URL` implementation. Supabase JS v2 uses `URL` internally for auth and storage. The polyfill must run before any Supabase code is imported.

**Fix / Rule:** Always make `react-native-url-polyfill/auto` the very first import in `app/_layout.tsx`:

```typescript
// correct — must be line 1
import 'react-native-url-polyfill/auto';
import '../global.css';
import { useEffect } from 'react';
// ... rest of imports
```

---

### Never nest ScrollView inside a parent ScrollView with the same scroll direction
**Problem:** Putting a vertical `ScrollView` (or `FlatList`) inside another vertical `ScrollView` causes layout bugs — the inner list collapses to zero height or scrolling conflicts between the two.

**Root cause:** React Native cannot measure the inner scroll container's height when it's inside an outer one with the same axis. The inner view gets 0 height by default.

**Fix / Rule:** For short, static lists inside a scrollable form, use `.map()` instead of `FlatList`/`ScrollView`. For the district picker specifically: use `nestedScrollEnabled` + a fixed `maxHeight` style (not a className) so the outer ScrollView knows the inner height.

```typescript
// wrong — collapses inside parent ScrollView
<FlatList data={districts} renderItem={...} />

// correct for short lists inside forms
{districts.map(d => <DistrictRow key={d.id} district={d} />)}

// correct for contained scrollable area (e.g. DistrictPicker)
<ScrollView style={{ maxHeight: 200 }} nestedScrollEnabled>
  {districts.map(...)}
</ScrollView>
```
