Run Maestro E2E tests against the running Expo dev build.

## Prerequisites
- Maestro installed: `brew install mobile-dev-inc/tap/maestro` (Mac) or see maestro.mobile.dev
- Expo dev build running on simulator/emulator

## Steps

1. Start Expo if not running:
```bash
npx expo start --ios   # or --android
```

2. Run all E2E flows:
```bash
maestro test .maestro/
```

3. Run a specific flow:
```bash
maestro test .maestro/<flow-name>.yaml
```

## E2E Flow Files (`.maestro/`)
Each flow maps to a critical user journey:

| File | Journey |
|------|---------|
| `auth-patient.yaml` | Patient register → login |
| `auth-physio.yaml` | Physio register → login |
| `patient-search.yaml` | Search physios by district |
| `booking-flow.yaml` | Full booking: select physio → book → confirm |
| `physio-confirm.yaml` | Physio confirms/declines booking |
| `review-submit.yaml` | Patient submits review after completed booking |

## Coverage Gates for E2E
- Phase 1: All 6 critical flows must pass
- Phase 2: Add quiz, availability, payment flows
- Phase 3: Add consultation, insurance flows

## Report Format
List each flow: PASS / FAIL with failure screenshot path if failed.
