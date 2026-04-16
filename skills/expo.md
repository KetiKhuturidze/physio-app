# Expo Skills

Patterns and lessons for the Expo managed workflow, Metro bundler, and build tooling.

---

## Learned in Practice

### metro-config disappears on clean install — it must be an explicit dependency
**Problem:** `npx expo start` fails with `Cannot find module 'metro-config'` after a clean install or after running `npm ci`. Metro bundler cannot start.

**Root cause:** `metro-config` is a peer dependency of `@expo/metro` but is not always hoisted to `node_modules` root when the dependency tree is resolved fresh. Npm may leave the folder with only a README and no `package.json`, causing Node's module resolver to find the folder but fail to load it.

**Fix / Rule:** If this error appears, delete the corrupted folder and reinstall:
```bash
rm -rf node_modules/metro-config
npm install
```

To prevent recurrence, verify that `metro-config` appears in `node_modules/metro-config/package.json` after install. If the project pins Expo SDK version, `metro-config` should be pulled in reliably — the issue usually appears after partial installs or interrupted `npm install` runs.

---

### expo-file-system v19 split into new API and legacy API
**Problem:** `import * as FileSystem from 'expo-file-system'` no longer exports `EncodingType` or `readAsStringAsync` in expo-file-system v19+. Accessing `FileSystem.EncodingType.Base64` throws `Cannot read property 'Base64' of undefined` at runtime.

**Root cause:** expo-file-system v19 introduced a new API surface. The old API (`readAsStringAsync`, `EncodingType`, `writeAsStringAsync`, etc.) was moved to the `/legacy` export path.

**Fix / Rule:** Import from the legacy path for any code that uses the old API:
```typescript
// wrong — EncodingType is undefined in v19 default export
import * as FileSystem from 'expo-file-system';

// correct
import * as FileSystem from 'expo-file-system/legacy';
// FileSystem.EncodingType.Base64, FileSystem.readAsStringAsync etc. all work
```
