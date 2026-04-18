# Memory Index
Claude reads this at session start. Keep under 50 lines.

## Current Phase
**Phase:** Phase 1 MVP (in progress)
**Last session:** 2026-04-18
**Branch:** `feature/booking-flow`
**Next tasks:** FE-011 (patient profile: saved address), FE-010 (review submission screen)

## What's Already Built
**FE DONE:** FE-001 login, FE-002 register, FE-003 patient home + location, FE-004 physio profile (patient view, services + reviews), FE-005 booking screen, FE-006 patient bookings list, FE-007 physio dashboard, FE-008 physio bookings (confirm/decline), FE-009 physio profile edit (avatar, services, districts, tags), FE-011 patient profile + logout.
**BE DONE:** BE-004 useAuth, BE-005 useBookings (createBooking + updateBookingStatus), BE-006 useLocation, BE-009 types (PhysioService, no hourly_rate), BE-010 usePhysios. DB schema/RLS/seed managed in Supabase dashboard (not CLI).
**Components done:** PhysioCard (no rate), BookingCard, DistrictPicker (scrollable, maxHeight 200).
**Infra done:** ESLint, Jest (84 tests, 83.7% coverage, Phase 1 gate PASS), Maestro (6 E2E flows).
**See:** memory/TASKS.md for full task status.

## Shells / Empty (need implementation)
- `app/(patient)/quiz.tsx` — shell ← Phase 2
- `app/(physio)/earnings.tsx` — shell ← Phase 2

## Key DB Facts
- `hourly_rate` **removed** from `physio_profiles` — replaced by `physio_services` table
- `physio_services`: id, physio_id, name, duration_minutes, price, description, created_at
- `isProfileComplete` checks: bio + base_district_id + physio_services.length > 0
- Avatar bucket: `UPDATE storage.buckets SET public = true WHERE id = 'avatars';`

## Recent Decisions
2026-04-18 · Dashboard bookings section: live stat tiles (pending/total) + "ყველა →" link, not repeated BookingCard list
2026-04-17 · Districts must be seeded with ST_SetSRID(ST_MakePoint(lng, lat), 4326) · SRID 0 silently breaks PostGIS distance
2026-04-16 · Replaced hourly_rate with physio_services table · per-service pricing more flexible
2026-04-16 · DistrictPicker wrapped in ScrollView (maxHeight 200) · was expanding full height inside form ScrollView
2026-04-16 · expo-file-system/legacy import path · v19 moved EncodingType to legacy export
2026-04-15 · Avatar upload: expo-file-system + base64-arraybuffer (NOT fetch+blob) · fetch+blob causes StorageUnknownError on physical device

## Active Blockers
AVATAR · bucket must have public=true: `UPDATE storage.buckets SET public = true WHERE id = 'avatars';`

## Sessions
- [2026-04-18b](sessions/2026-04-18b.md) — INFRA-005 coverage gate: 84 tests, 83.7%, Phase 1 PASS. BE-007/BE-008 done.
- [2026-04-18](sessions/2026-04-18.md) — FE-008 physio bookings done, dashboard live booking summary, bug fix
- [2026-04-17](sessions/2026-04-17.md) — districts ST_SetSRID fix, FE-005/006/BE-005 confirmed done, react-test-renderer pinned
- [2026-04-16](sessions/2026-04-16.md) — booking flow built, physio services, DistrictPicker scroll fix
