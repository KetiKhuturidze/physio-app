Run Jest unit/integration tests and enforce phase coverage gate.

## Steps

1. Run tests with coverage:
```bash
npx jest --coverage --coverageReporters=text-summary
```

2. Check coverage against the current phase gate (see `workflows/coverage-gates.md`):
   - Phase 1 (MVP): **>60%** overall coverage
   - Phase 2: **>70%** overall coverage
   - Phase 3: **>85%** overall coverage
   - Final/Complete: **100%** coverage

3. Report:
   - Current coverage %
   - Gate for current phase
   - PASS or FAIL
   - If FAIL: list the 5 lowest-covered files that are part of the current phase scope

## Coverage Scope Rules
- `src/hooks/` — must be tested (data logic lives here)
- `src/components/` — test interaction logic, not pure render
- `app/` screens — integration tests with RNTL
- `supabase/functions/` — unit test edge functions separately

## Test File Conventions
- Unit: `__tests__/unit/ComponentName.test.tsx`
- Integration: `__tests__/integration/useHookName.test.ts`
- E2E: separate Maestro flows in `.maestro/`
