# Phase 1 MVP — Task Tracker
Last updated: 2026-04-18

## FE Tasks

| ID | Task | Status | Notes |
|----|------|--------|-------|
| FE-001 | Login screen | ✅ DONE | app/(auth)/login.tsx |
| FE-002 | Register screen | ✅ DONE | app/(auth)/register.tsx |
| FE-003 | Patient home + district search | ✅ DONE | home.tsx + no-local-physios amber banner + auto-fallback to all |
| FE-004 | Physio profile page (patient view) | ✅ DONE | app/(patient)/physio/[id].tsx — services, reviews, book button |
| FE-005 | Booking flow | ✅ DONE | service picker, address, district, time, notes → createBooking() |
| FE-006 | Patient bookings list | ✅ DONE | app/(patient)/bookings.tsx — useBookings('patient') + BookingCard |
| FE-007 | Physio dashboard | ✅ DONE | live booking summary (pending/total tiles), useFocusEffect re-fetch |
| FE-008 | Physio bookings + confirm/decline | ✅ DONE | app/(physio)/bookings.tsx — pending/history sections + actions |
| FE-009 | Physio profile edit | ✅ DONE | avatar upload, districts, specialties, languages, services |
| FE-010 | Review submission | ✅ DONE | app/(patient)/review/[bookingId].tsx — star picker, duplicate guard, success state |
| FE-011 | Patient profile | ✅ DONE | edit name/phone, saved default address + district, pre-fills booking form |

## BE Tasks

| ID | Task | Status | Notes |
|----|------|--------|-------|
| BE-001 | DB schema | ✅ DONE | Managed via Supabase dashboard SQL editor |
| BE-002 | RLS policies | ✅ DONE | All tables covered |
| BE-003 | Tbilisi districts seed | ✅ DONE | ST_SetSRID(ST_MakePoint(lng,lat),4326) |
| BE-004 | useAuth hook + Zustand store | ✅ DONE | src/stores/useAuthStore.ts + root _layout.tsx |
| BE-005 | useBookings hook | ✅ DONE | useBookings(role), createBooking(), updateBookingStatus() |
| BE-006 | useLocation hook | ✅ DONE | PostGIS nearest_district RPC |
| BE-007 | Push notifications | ✅ DONE | registerForPushNotifications + triggerBookingNotification wired |
| BE-008 | Email via Resend (Edge Function) | ✅ DONE | notify-booking deployed to Supabase dashboard |
| BE-009 | TypeScript types | ✅ DONE | push_token added to User |
| BE-010 | usePhysios hook | ✅ DONE | district filter + rating aggregation |

## Bug Fixes (this branch)

| ID | Fix | Status |
|----|-----|--------|
| FIX-003 | Dashboard showed stale profile after edit | ✅ DONE | useFocusEffect on dashboard + profile tabs |
| FIX-004 | Patient home dead-ended when no local physios | ✅ DONE | auto-fallback to all physios + amber banner |
| FIX-005 | Dashboard "ჯავშნები მალე გამოჩნდება" ignored real data | ✅ DONE | wired useBookings('physio') into dashboard |

## Infrastructure

| ID | Task | Status | Notes |
|----|------|--------|-------|
| INFRA-001 | ESLint setup | ✅ DONE | zero warnings policy |
| INFRA-002 | Jest infrastructure | ✅ DONE | 18 tests, react-test-renderer@19.1.0 pinned |
| INFRA-003 | Maestro E2E flows | ✅ DONE | 6 flows |
| INFRA-004 | Avatar upload fix | ✅ DONE | expo-file-system/legacy + base64-arraybuffer |
| INFRA-005 | Coverage gate | ✅ DONE | 84 tests, 83.7% statements (gate 60% PASSED) |

## Phase 1 Ship — COMPLETE ✅

All Phase 1 tasks done. Pending user action:
- Run in Supabase SQL editor: `ALTER TABLE users ADD COLUMN IF NOT EXISTS default_address text; ALTER TABLE users ADD COLUMN IF NOT EXISTS default_district_id uuid REFERENCES districts(id);`

---

## Phase 2 Tasks

| ID | Task | Status | Notes |
|----|------|--------|-------|
| CHAT-001 | In-app messaging (patient ↔ physio) | ⬜ TODO | conversations table (patient_id, physio_id), messages table (conversation_id, sender_id, content, created_at), chat screen for both roles, real-time via Supabase Realtime, push notification for new messages |
