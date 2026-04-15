# Coverage Gates

| Phase | Gate | Key files minimum |
|-------|------|-------------------|
| 1 MVP | >60% | hooks >80%, lib >80% |
| 2 | >70% | + quiz/availability hooks |
| 3 | >85% | + edge functions |
| Complete | 100% | everything |

## Check Coverage
```bash
npx jest --coverage --coverageReporters=text-summary
```

## jest.config.js threshold (update per phase)
```javascript
coverageThreshold: {
  global: { statements: 60, branches: 60, functions: 60, lines: 60 }
}
```
Change 60 → 70 when entering Phase 2, → 85 for Phase 3.

## Collect From
```javascript
collectCoverageFrom: [
  'src/**/*.{ts,tsx}',
  'app/**/*.{ts,tsx}',
  'supabase/functions/**/*.ts',
  '!**/*.d.ts',
]
```
