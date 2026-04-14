# React Native + Expo Rules

## Components
- Functional only, no class components
- Props interface above component: `interface Props {}`
- Use `function Comp({ prop }: Props)` — not `React.FC`
- One component per file, default export at bottom

## Imports
- Absolute from `src/` — never `../../`
- Order: React → RN/Expo → 3rd party → local

## Styling (NativeWind)
- `className` only — never `StyleSheet.create()`
- No `style={{ color: 'red' }}` inline objects
- Platform: `ios:` / `android:` NativeWind prefixes

## Performance
- `FlashList` (not FlatList) for long lists
- `React.memo` for expensive pure components
- `useCallback` for callbacks passed to children

## Navigation (Expo Router)
- `router.push('/path')` in handlers
- `<Link href="/path">` for tappable elements
- Auth guard in `app/_layout.tsx`

## State (Zustand)
- One store per domain: `useAuthStore`, `useBookingsStore`
- No derived values in store — compute them
- Never put server state in Zustand

## Error Handling
- Never silent errors
- Georgian user message + technical log (no user data)

## Learned in Practice
<!-- /update-skill appends here -->
