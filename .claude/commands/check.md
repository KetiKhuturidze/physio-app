Run full static analysis: TypeScript type-check + ESLint.

## Steps

1. Run TypeScript compiler in no-emit mode:
```bash
npx tsc --noEmit
```
If errors exist, list them grouped by file. Fix all errors before proceeding — never use `any` as a workaround.

2. Run ESLint:
```bash
npx eslint . --ext .ts,.tsx --max-warnings 0
```
Fix all warnings and errors. Zero-warning policy is enforced.

3. Report result:
- PASS: "check passed — 0 type errors, 0 lint warnings"
- FAIL: list each error with file:line and the fix applied

## Rules
- `any` type is never acceptable — use `unknown` + type guard or proper types
- Fix the root cause, not the symptom (no `// @ts-ignore`)
- All Supabase query results must be typed — never use implicit `any` from `data`
