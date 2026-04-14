# Task System — Physio App

## Structure

```
tasks/
├── phase1-mvp/
│   ├── overview.md    ← phase goals + coverage gate
│   ├── fe-tasks.md    ← all frontend tasks
│   └── be-tasks.md    ← all backend/supabase tasks
├── phase2/
│   ├── overview.md
│   ├── fe-tasks.md
│   └── be-tasks.md
└── phase3/
    ├── overview.md
    ├── fe-tasks.md
    └── be-tasks.md
```

## Task ID Format
- `FE-001`, `FE-002` ... — frontend tasks
- `BE-001`, `BE-002` ... — backend tasks
- IDs are unique across all phases (no reuse)

## Status Values
- `TODO` — not started
- `IN_PROGRESS` — currently being worked on (max 1 per session)
- `DONE` — code written + /check passed + /test passed
- `BLOCKED` — waiting on dependency (note what)

## Slash Commands
- `/new-task` — add a task interactively
- `/phase` — see progress across all phases
- `/test` — run tests + check coverage gate
- `/check` — typecheck + lint

## Rules
- A task is DONE only when: code written + `/check` passes + `/test` passes + E2E flow exists (for user-facing features)
- Never mark IN_PROGRESS more than 1 task at a time
- Sub-tasks must all be checked off before parent task is DONE
