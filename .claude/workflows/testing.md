# Testing Strategy

## Stack
- Unit/Integration: **Jest + React Native Testing Library**
- E2E: **Maestro** (`/.maestro/*.yaml`)
- Type check: `tsc --noEmit`

## What Goes Where
- `src/hooks/` → unit test every hook (mock Supabase)
- `src/components/` → test user interactions (press, input, conditional render)
- `app/` screens → integration tests with RNTL
- `supabase/functions/` → unit test each edge function

## Supabase Mock (put in `__mocks__/src/lib/supabase.ts`)
```typescript
export const supabase = {
  from: jest.fn(() => ({
    select: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    single: jest.fn(),
    insert: jest.fn(),
    update: jest.fn(),
  })),
  auth: {
    signInWithPassword: jest.fn(),
    signUp: jest.fn(),
    signOut: jest.fn(),
    getSession: jest.fn(),
    onAuthStateChange: jest.fn(() => ({
      data: { subscription: { unsubscribe: jest.fn() } },
    })),
  },
};
```

## E2E Flows (`.maestro/`)
`auth-patient.yaml` · `auth-physio.yaml` · `patient-search.yaml`
`booking-flow.yaml` · `physio-confirm.yaml` · `review-submit.yaml`

## Coverage Gates
Phase 1 >60% · Phase 2 >70% · Phase 3 >85% · Final 100%
Measured as lowest of: statements, branches, functions, lines.
