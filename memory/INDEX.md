# Memory Index
Claude reads this at session start. Keep under 50 lines.

## Current Phase
**Phase:** Phase 1 MVP — COMPLETE ✅ (bug-fixes merged to dev 2026-08-09)
**Last session:** 2026-08-09
**Branch:** `dev` (clean)
**Next tasks:** Phase 2 planning — CHAT-001 (in-app messaging) or new bug triage

## What's Already Built
**FE DONE:** FE-001 login, FE-002 register, FE-003 patient home + location, FE-004 physio profile (patient view, services + reviews), FE-005 booking screen, FE-006 patient bookings list, FE-007 physio dashboard, FE-008 physio bookings (confirm/decline), FE-009 physio profile edit (avatar, services, districts, tags), FE-010 review submission, FE-011 patient profile + logout.
**BE DONE:** BE-004 useAuth, BE-005 useBookings, BE-006 useLocation, BE-007 push notifications, BE-008 email (Resend), BE-009 types, BE-010 usePhysios.
**Infra:** ESLint, Jest (84 tests, 83.64% coverage, Phase 1 gate PASS), Maestro (6 E2E flows), ui-ux-pro-max skill installed.
**See:** memory/TASKS.md for full task + bug status.

## Shells / Empty (need implementation)
- `app/(patient)/quiz.tsx` — shell ← Phase 2
- `app/(physio)/earnings.tsx` — shell ← Phase 2

## Key DB Facts
- `hourly_rate` **removed** from `physio_profiles` — replaced by `physio_services` table
- `physio_services`: id, physio_id, name, duration_minutes, price, description, created_at
- `isProfileComplete` checks: bio + base_district_id + physio_services.length > 0
- Avatar bucket: `UPDATE storage.buckets SET public = true WHERE id = 'avatars';`
- `User.phone` is `string | null` (nullable DB column — type fixed 2026-08-09)

## Recent Decisions
2026-08-09 · handleLogout: try/finally always — signOut() confirmed before clearing local state
2026-08-09 · No console.log/error anywhere — use UI error state; DB errors must never be logged
2026-08-09 · INITIAL_SESSION query: 6s Promise.race timeout (Android slow network fix)
2026-08-09 · .maybeSingle() not .single() for existence checks — .single() errors on zero rows
2026-04-18 · Dashboard: live stat tiles (pending/total) + link, not BookingCard list
2026-04-17 · Districts seeded with ST_SetSRID(ST_MakePoint(lng,lat),4326) · SRID 0 breaks PostGIS

## Active Blockers
AVATAR · bucket must have public=true: `UPDATE storage.buckets SET public = true WHERE id = 'avatars';`

## Sessions
- [2026-08-09](sessions/2026-08-09.md) — BUG-004–010 fixed, /check+/test passed, merged dev, EAS OTA pushed
- [2026-04-18b](sessions/2026-04-18b.md) — INFRA-005 coverage gate: 84 tests, 83.7%, Phase 1 PASS. BE-007/BE-008 done.
- [2026-04-18](sessions/2026-04-18.md) — FE-008 physio bookings done, dashboard live booking summary, bug fix
- [2026-04-17](sessions/2026-04-17.md) — districts ST_SetSRID fix, FE-005/006/BE-005 confirmed done, react-test-renderer pinned
- [2026-04-16](sessions/2026-04-16.md) — booking flow built, physio services, DistrictPicker scroll fix
