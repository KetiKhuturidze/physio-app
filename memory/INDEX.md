# Memory Index
Claude reads this at session start. Keep under 50 lines.

## Current Phase
**Phase:** Phase 1 MVP (in progress)
**Last session:** 2026-04-15
**Next tasks:** BE-001 (migrations), BE-002 (RLS), BE-003 (districts seed), FE-005 (booking flow), FE-006 (patient bookings), FE-008 (physio bookings), BE-005 (useBookings hook), BE-007 (push notifications), BE-008 (email edge function)

## What's Already Built
**FE DONE:** FE-001 login, FE-002 register, FE-003 patient home + location, FE-004 physio profile view, FE-007 physio dashboard, FE-009 physio profile edit (avatar upload, district picker, tag inputs), FE-011 patient profile + logout. Also: physio own profile view (app/(physio)/profile.tsx).
**BE DONE:** BE-004 useAuth (Zustand store + root layout bootstrap), BE-006 useLocation (PostGIS nearest_district RPC), BE-009 TypeScript types, BE-010 usePhysios hook (with rating aggregation).
**Components done:** PhysioCard, BookingCard, DistrictPicker.

## Shells / Empty (need implementation)
- `app/(patient)/book/[physioId].tsx` — empty `<View />`
- `app/(patient)/bookings.tsx` — empty `<View />`
- `app/(physio)/bookings.tsx` — empty `<View />`
- `src/hooks/useBookings.ts` — empty function
- `src/lib/notifications.ts` — just `export {}`
- `app/(patient)/quiz.tsx`, `map.tsx`, `app/(physio)/availability.tsx`, `earnings.tsx` — Phase 2 shells

## Missing Entirely
- `supabase/functions/` — empty (.gitkeep only, no email function)
- DB schema/RLS/seed — managed directly in Supabase dashboard SQL editor, not via migration files

## Cleanup Needed
- `app/index 2.tsx` — duplicate, delete
- `src/stores/useAuthStore 2.ts` — duplicate, delete

## Recent Decisions
<!-- Format: YYYY-MM-DD · [decision] · why -->
2026-04-15 · Added .eslintrc.js extending eslint-config-expo · zero-warning policy enforced
2026-04-15 · Avatar cache-buster: getPublicUrl URL gets ?t=Date.now() suffix · React Native Image caches by URL; same path on re-upload served stale image
2026-04-15 · Deleted index.ts (bare-workflow leftover) · Expo Router uses "main": "expo-router/entry", file was unused and caused TS casing error

## Active Blockers
<!-- Format: [task ID] · [blocker] -->
BE-007/008 · notifications.ts and email edge function not yet implemented
AVATAR · bucket public flag must be set: UPDATE storage.buckets SET public = true WHERE id = 'avatars';

## Sessions
<!-- Latest first, max 10 entries -->
2026-04-15 · Fixed avatar bug (cache-buster), ESLint setup, TS cast fixes, deleted index.ts · —
2026-04-15 · Initial project scan — assessed all built screens and hooks · —
