# Phase 1 — MVP Overview

## Goal
Launch the core two-sided marketplace: patients find and book physios, physios manage bookings. No payments. MVP in Tbilisi only.

## Coverage Gate
**>60%** overall (statements, branches, functions, lines — lowest of the four)

## Phase Complete When
- [ ] All FE tasks DONE
- [ ] All BE tasks DONE
- [ ] `/check` passes (0 errors, 0 warnings)
- [ ] `/test` coverage ≥ 60%
- [ ] All 6 Maestro E2E flows pass
- [ ] App runs on iOS Simulator without crashes

## Key Deliverables
1. Auth: register as patient or physio, login, logout
2. Patient: find physios by district, view profile, book
3. Physio: manage bookings (confirm/decline), edit profile
4. Notifications: push + email on booking events
5. Reviews: post-session review submission

## Screens Inventory
| Screen | File | Status |
|--------|------|--------|
| Login | `app/(auth)/login.tsx` | shell |
| Register | `app/(auth)/register.tsx` | shell |
| Patient Home | `app/(patient)/home.tsx` | shell |
| Physio Profile | `app/(patient)/physio/[id].tsx` | shell |
| Book | `app/(patient)/book/[physioId].tsx` | shell |
| Patient Bookings | `app/(patient)/bookings.tsx` | shell |
| Patient Profile | `app/(patient)/profile.tsx` | shell |
| Quiz | `app/(patient)/quiz.tsx` | Phase 2 |
| Map | `app/(patient)/map.tsx` | Phase 2 |
| Physio Dashboard | `app/(physio)/dashboard.tsx` | shell |
| Physio Bookings | `app/(physio)/bookings.tsx` | shell |
| Profile Edit | `app/(physio)/profile-edit.tsx` | shell |
| Availability | `app/(physio)/availability.tsx` | Phase 2 |
| Earnings | `app/(physio)/earnings.tsx` | Phase 2 |

## Not In Phase 1
- Quiz screen (Phase 2)
- Map screen (Phase 2)
- Availability calendar (Phase 2)
- Earnings dashboard (Phase 2)
- Flitt payments (Phase 2)
- Insurance (Phase 3)
- Online consultations (Phase 3)
