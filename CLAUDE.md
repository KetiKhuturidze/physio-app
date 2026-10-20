# Physio App — Claude Code Briefing

## What this project is
A two-sided mobile marketplace built with React Native + Expo 
connecting patients with physiotherapists for at-home visits 
in Tbilisi, Georgia. Patients find and book physios. Physios 
manage bookings and their public profile. MVP has no in-app 
payments — patients pay cash at the door.

---

## Tech Stack
- Framework: React Native + Expo (managed workflow)
- Language: TypeScript — strict mode, never use any
- Navigation: Expo Router (file-based)
- Styling: NativeWind (Tailwind syntax for React Native)
- State: Zustand for global state (auth, user session)
- Backend: Supabase (Postgres + Auth + Storage + Edge Functions)
- Location: expo-location + PostGIS in Supabase
- Maps: react-native-maps + Google Maps API
- Notifications: expo-notifications + Expo Push Service
- Email: Resend (via Supabase Edge Functions)

---

## Folder Structure
physio-app/
├── app/
│   ├── (auth)/
│   │   ├── login.tsx
│   │   └── register.tsx
│   ├── (patient)/
│   │   ├── _layout.tsx
│   │   ├── home.tsx
│   │   ├── physio/[id].tsx
│   │   ├── book/[physioId].tsx
│   │   ├── bookings.tsx
│   │   ├── quiz.tsx          ← shell
│   │   ├── map.tsx           ← shell
│   │   └── profile.tsx
│   ├── (physio)/
│   │   ├── _layout.tsx
│   │   ├── dashboard.tsx
│   │   ├── availability.tsx  ← shell
│   │   ├── profile-edit.tsx
│   │   ├── bookings.tsx
│   │   └── earnings.tsx      ← shell
│   └── _layout.tsx
├── src/
│   ├── lib/
│   │   ├── supabase.ts
│   │   └── notifications.ts
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   ├── useLocation.ts
│   │   └── useBookings.ts
│   ├── components/
│   │   ├── PhysioCard.tsx
│   │   ├── BookingCard.tsx
│   │   ├── DistrictPicker.tsx
│   │   └── ui/
│   ├── types/
│   │   └── index.ts
│   └── constants/
│       ├── districts.ts
│       ├── strings.ka.ts
│       └── strings.en.ts
├── docs/
│   └── app-overview.html
├── supabase/
│   ├── migrations/
│   └── functions/
├── CLAUDE.md
├── .env
├── app.json
└── package.json

---

## Database Schema
All tables in Supabase Postgres. PostGIS enabled.

users
  id uuid (auth.users FK)
  email text
  phone text
  full_name text
  role text ('patient' | 'physio')
  avatar_url text
  created_at timestamptz

physio_profiles
  id uuid
  user_id uuid → users.id
  bio text
  specialties text[]
  languages text[]
  hourly_rate numeric
  base_district_id uuid → districts.id
  is_verified boolean default false
  is_active boolean default true
  created_at timestamptz

districts
  id uuid
  name_en text
  name_ka text
  center geography(Point, 4326)

physio_service_areas
  id uuid
  physio_id uuid → physio_profiles.id
  district_id uuid → districts.id

availability_slots
  id uuid
  physio_id uuid → physio_profiles.id
  date date
  start_time time
  end_time time
  is_booked boolean default false

bookings
  id uuid
  patient_id uuid → users.id
  physio_id uuid → physio_profiles.id
  slot_id uuid → availability_slots.id
  status text ('pending'|'confirmed'|'declined'|'completed'|'cancelled')
  patient_address text
  patient_district_id uuid → districts.id
  notes text
  requested_time text
  created_at timestamptz

reviews
  id uuid
  booking_id uuid → bookings.id
  patient_id uuid → users.id
  physio_id uuid → physio_profiles.id
  rating integer (1–5)
  comment text
  created_at timestamptz

---

## Auth + Roles
- Supabase Auth: email/password
- users.role: 'patient' | 'physio'
- Role set on registration, never changed
- Expo Router redirects by role on launch
- RLS on every table — no exceptions

---

## Privacy Rules
- Physios see full patient details (address, phone, notes)
  for bookings where they are the assigned physio — RLS enforces this
- SUPABASE_SERVICE_ROLE_KEY: Edge Functions only, never in app
- No console.log with user data anywhere
- Push tokens: never logged, never exposed client-side
- Every new table must have RLS — no exceptions
- Anon key is read-only — all writes require authenticated user

---

## Language
- UI strings: Georgian default, English fallback
- Georgian strings: src/constants/strings.ka.ts
- English strings: src/constants/strings.en.ts
- Never hardcode user-facing text directly in components

---

## Naming Conventions
- Components: PascalCase → PhysioCard.tsx
- Hooks: camelCase with use prefix → useAuth.ts
- Files: kebab-case (except components)
- Constants: SCREAMING_SNAKE_CASE
- DB columns: snake_case
- TypeScript types: PascalCase → BookingStatus, PhysioProfile
- Zustand stores: camelCase → useAuthStore

---

## Code Conventions
- Functional components only, no class components
- All Supabase queries in custom hooks in src/hooks/
- All shared types in src/types/index.ts
- NativeWind className props — no inline StyleSheet
- Always handle { data, error } from Supabase — never ignore
- Always async/await — never .then() chains
- Absolute imports from src/ — never relative ../../

---

## Business Rules (MVP)
- No in-app payments — cash at door
- No subscription billing yet — physios free for 2 months
- is_verified starts false — manually set by admin
- Booking: patient requests → physio confirms/declines → patient notified
- Availability: free text for MVP, no slot picker yet
- Location: patient GPS → district → physios who serve that district
- Physio location: district only shown to patients, never exact address

---

## Notifications
- Push: expo-notifications for all booking events
- Email: Resend via Edge Function on booking creation
- Physios get push + email for new requests
- Patients get push for status changes

---

## Environment Variables
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_ANON_KEY=
EXPO_PUBLIC_GOOGLE_MAPS_KEY=
RESEND_API_KEY=   ← Edge Functions only

---

## Deployment & Publishing

**Accounts (as of 2026-10-20):**
- EAS project: `@ketevankhuturidze/thera-app`, Android package `ge.thera.app`
- Play Console app exists (category: Medical), Internal testing track is live
- Google Cloud project for the Play Developer API: `thera-161ca` — free API, no billing needed. (A separate, unrelated Google Cloud project/org was used for an earlier Google Maps API attempt and hit a billing wall — don't confuse the two.)
- Service account `thera-play-publisher@thera-161ca.iam.gserviceaccount.com` is invited to Play Console with **testing-track-only** permission (not production — deliberate, least privilege)
- Privacy policy: `https://privacy.thera.ge` (Cloudflare Pages project `thera-privacy`, deployed from `docs/privacy-site/`). Delete-account URL: `https://privacy.thera.ge/#s-delete`
- `eas.json` has a `submit.production` profile pointing at `secrets/play-service-account.json`, track `internal`

**Files that exist only on the original dev machine, never in git** (a fresh clone/cloud session needs these recreated before `eas build`/`eas submit` will work):
- `.env` — Supabase URL/anon key (also must be pushed to EAS as build-time env vars via `eas env:create`, see below)
- `secrets/play-service-account.json` — Play Developer API service account key
- A logged-in `eas-cli` session (`eas login`)

**Known footgun (fixed once, can recur):** `src/lib/supabase.ts` creates the Supabase client at module load. If `EXPO_PUBLIC_SUPABASE_URL`/`ANON_KEY` aren't set as **EAS environment variables** (`eas env:list --environment production`) — not just in local `.env` — a standalone EAS build will crash before rendering anything, with no error shown (blank white screen), because `.env` is gitignored and never reaches EAS's build servers. Check `eas env:list` for all three environments (production/preview/development) before trusting a build that isn't tethered to a local Metro server.

---

## Phase Boundaries
MVP now: registration, profiles, district search,
  booking flow, push + email, reviews shell
Phase 2: intake quiz, availability calendar, Flitt payments,
  video content, physio dashboard, subscription billing
Phase 3: online doctor consultations, insurance integration,
  expand to other cities

When asked to build Phase 2 or 3 features — flag it 
and ask for confirmation before proceeding.

---

## Claude Code Behaviour
- Ask only when genuinely unsure about architecture
- Never add Phase 2 or 3 features unprompted
- Always handle Supabase errors
- Always async/await
- Never use type any
- Georgian default for all user-facing strings

---

## Georgian Context
- App is for Tbilisi, Georgia
- Tbilisi districts pre-seeded in districts table
- Local payment: Flitt (TBC Group) — Phase 2
- Insurance: Imedi L, Aldagi — Phase 3
- Target: elderly, post-surgery, mobility-impaired patients
