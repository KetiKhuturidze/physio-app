# Dev Loop

Every task: **Plan → Build → Check → Test → E2E → Done**

```
/phase          → pick next task
"დავიწყოთ FE-XXX"
/check          → must be 0 errors before continuing
/test           → coverage gate for current phase
/e2e            → run relevant Maestro flow
task → DONE     → /update-skill if non-obvious fix
```

## Build Rules
- Data logic → `src/hooks/` only, never in screens
- Strings → `src/constants/strings.ka.ts`, never hardcoded
- Styling → NativeWind `className`, never `StyleSheet`
- Supabase → always `{ data, error }`, never ignore error
- Types → never `any`, never `.then()` chains

## New Screen Checklist
- [ ] Route file in `app/(patient|physio)/`
- [ ] Strings in `strings.ka.ts` + `strings.en.ts`
- [ ] Types in `src/types/index.ts`
- [ ] Data hook in `src/hooks/`

## New Supabase Table Checklist
- [ ] Migration in `supabase/migrations/`
- [ ] RLS enabled — no exceptions
- [ ] TypeScript type in `src/types/index.ts`
- [ ] Hook in `src/hooks/`

## Hard Rules
- Never commit without user saying "commit"
- Never push without user saying "push"
- Never start Phase 2 features — flag + ask
