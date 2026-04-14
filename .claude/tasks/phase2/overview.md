# Phase 2 — Overview

## Unlock Condition
Phase 1 complete: all tasks DONE + coverage >60% + all 6 E2E flows passing.

## Goal
Enrich the platform: personalization quiz, real availability calendar, Flitt payments, physio earnings dashboard, video content.

## Coverage Gate
**>70%** overall (statements, branches, functions, lines — lowest of the four)

## Phase Complete When
- [ ] All Phase 2 FE tasks DONE
- [ ] All Phase 2 BE tasks DONE
- [ ] `/check` passes
- [ ] `/test` coverage ≥ 70%
- [ ] All Phase 2 E2E flows pass
- [ ] Phase 1 coverage remains ≥ 60% (don't regress)

## Key Deliverables
1. Intake quiz for patients (condition assessment → physio matching)
2. Availability calendar for physios (slot-based scheduling)
3. Flitt (TBC Group) payment integration — card payment at booking
4. Physio earnings dashboard
5. Video content (exercise demos, educational)
6. Subscription billing for physios (after free period)

## New Screens (from shells)
| Screen | File | Feature |
|--------|------|---------|
| Quiz | `app/(patient)/quiz.tsx` | Intake quiz flow |
| Map | `app/(patient)/map.tsx` | Physio map view |
| Availability | `app/(physio)/availability.tsx` | Calendar picker |
| Earnings | `app/(physio)/earnings.tsx` | Revenue dashboard |

## New E2E Flows
- `quiz-flow.yaml`
- `payment-flow.yaml`
- `availability-set.yaml`
