# Memory Index
Claude reads this at session start. Keep under 50 lines.

## Current Phase
**Phase:** Phase 1 MVP (in progress)
**Last session:** 2026-04-16
**Branch:** `feature/physio-services` (off `dev`)
**Next tasks:** FE-005 (booking screen), BE-005 (useBookings hook), FE-006 (patient bookings), FE-008 (physio bookings + confirm/decline)

## What's Already Built
**FE DONE:** FE-001 login, FE-002 register, FE-003 patient home + location, FE-004 physio profile (patient view, services + reviews), FE-007 physio dashboard, FE-009 physio profile edit (avatar, services, districts, tags), FE-011 patient profile + logout. Also: physio own profile view.
**BE DONE:** BE-004 useAuth, BE-006 useLocation, BE-009 types (PhysioService, no hourly_rate), BE-010 usePhysios. DB schema/RLS/seed managed in Supabase dashboard (not CLI).
**Components done:** PhysioCard (no rate), BookingCard, DistrictPicker (scrollable, maxHeight 200).
**Infra done:** ESLint, Jest (18 tests), Maestro (6 E2E flows).
**See:** memory/TASKS.md for full task status.

## Shells / Empty (need implementation)
- `app/(patient)/book/[physioId].tsx` — empty `<View />` ← FE-005
- `app/(patient)/bookings.tsx` — empty `<View />` ← FE-006
- `app/(physio)/bookings.tsx` — empty `<View />` ← FE-008
- `src/hooks/useBookings.ts` — empty function ← BE-005
- `src/lib/notifications.ts` — `export {}` ← BE-007
- `supabase/functions/` — .gitkeep only ← BE-008

## Key DB Facts
- `hourly_rate` **removed** from `physio_profiles` — replaced by `physio_services` table
- `physio_services`: id, physio_id, name, duration_minutes, price, description, created_at
- `isProfileComplete` checks: bio + base_district_id + physio_services.length > 0
- Avatar bucket: `UPDATE storage.buckets SET public = true WHERE id = 'avatars';`

## Recent Decisions
2026-04-16 · Replaced hourly_rate with physio_services table · per-service pricing more flexible
2026-04-16 · DistrictPicker wrapped in ScrollView (maxHeight 200) · was expanding full height inside form ScrollView
2026-04-16 · expo-file-system/legacy import path · v19 moved EncodingType to legacy export
2026-04-15 · Avatar upload: expo-file-system + base64-arraybuffer (NOT fetch+blob) · fetch+blob causes StorageUnknownError on physical device

## Active Blockers
BE-007/008 · push notifications and email edge function not yet implemented
AVATAR · bucket must have public=true: `UPDATE storage.buckets SET public = true WHERE id = 'avatars';`
