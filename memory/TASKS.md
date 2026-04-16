# Phase 1 MVP — Task Tracker
Last updated: 2026-04-16

## FE Tasks

| ID | Task | Status | Notes |
|----|------|--------|-------|
| FE-001 | Login screen | ✅ DONE | app/(auth)/login.tsx |
| FE-002 | Register screen | ✅ DONE | app/(auth)/register.tsx |
| FE-003 | Patient home + district search | ✅ DONE | app/(patient)/home.tsx, useLocation, PhysioCard |
| FE-004 | Physio profile page (patient view) | ✅ DONE | app/(patient)/physio/[id].tsx — services, reviews, book button |
| FE-005 | Booking flow | ✅ DONE | service picker, address, district, time, notes → createBooking() |
| FE-006 | Patient bookings list | ⬜ TODO | app/(patient)/bookings.tsx — empty shell |
| FE-007 | Physio dashboard | ✅ DONE | app/(physio)/dashboard.tsx — completion check uses services |
| FE-008 | Physio bookings + confirm/decline | ⬜ TODO | app/(physio)/bookings.tsx — empty shell |
| FE-009 | Physio profile edit | ✅ DONE | avatar upload, districts, specialties, languages, services |
| FE-010 | Review submission | ⬜ TODO | no screen yet |
| FE-011 | Patient profile + logout | ✅ DONE | app/(patient)/profile.tsx |

## BE Tasks

| ID | Task | Status | Notes |
|----|------|--------|-------|
| BE-001 | DB schema | ✅ DONE | Managed via Supabase dashboard SQL editor — physio_services added, hourly_rate removed |
| BE-002 | RLS policies | ✅ DONE | Set in Supabase dashboard — all tables covered |
| BE-003 | Tbilisi districts seed | ✅ DONE | Seeded in Supabase dashboard |
| BE-004 | useAuth hook + Zustand store | ✅ DONE | src/stores/useAuthStore.ts, root _layout.tsx |
| BE-005 | useBookings hook | ✅ DONE | useBookings(role), createBooking(), updateBookingStatus() |
| BE-006 | useLocation hook | ✅ DONE | src/hooks/useLocation.ts — PostGIS nearest_district RPC |
| BE-007 | Push notifications | ⬜ TODO | src/lib/notifications.ts — export {} only |
| BE-008 | Email via Resend (Edge Function) | ⬜ TODO | supabase/functions/ — empty |
| BE-009 | TypeScript types | ✅ DONE | src/types/index.ts — PhysioService added, hourly_rate removed |
| BE-010 | usePhysios hook | ✅ DONE | src/hooks/usePhysios.ts — district filter + rating aggregation |

## Additional Tasks (not in original index)

| ID | Task | Status | Notes |
|----|------|--------|-------|
| PROFILE-008 | Physio services (replaces hourly_rate) | ✅ DONE | physio_services table; edit/view screens updated |
| PROFILE-009 | DistrictPicker scrollable | ✅ DONE | ScrollView maxHeight 200, nestedScrollEnabled |
| FIX-001 | Dashboard completion check | ✅ DONE | Removed hourly_rate from query; now checks bio + district + services |
| FIX-002 | Service form field labels | ✅ DONE | Labels added above all 4 inputs in add-service form |
| INFRA-001 | ESLint setup | ✅ DONE | .eslintrc.js extending eslint-config-expo, zero warnings |
| INFRA-002 | Jest test infrastructure | ✅ DONE | jest@29 + jest-expo@55, 18 tests passing (useAuthStore, PhysioCard) |
| INFRA-003 | Maestro E2E flows | ✅ DONE | 6 flows written; auth flows runnable, booking/review are skeletons |
| INFRA-004 | Avatar upload fix | ✅ DONE | expo-file-system/legacy + base64-arraybuffer; no fetch+blob |

## What's Left for Phase 1 MVP

Priority order:
1. **FE-005** — Booking screen `app/(patient)/book/[physioId].tsx` (patient selects service + time + address)
2. **FE-006** — Patient bookings list `app/(patient)/bookings.tsx`
3. **FE-008** — Physio bookings screen `app/(physio)/bookings.tsx` (confirm/decline)
4. **BE-005** — `useBookings` hook (shared data layer for FE-005/006/008)
5. **BE-007** — Push notifications (booking events)
6. **BE-008** — Email via Resend Edge Function (booking creation)
7. **FE-010** — Review submission

## Phase 1 Coverage Gate
Current: ~13% (18 tests). Target: >60%.
Needs: tests for usePhysios, useLocation, DistrictPicker.
