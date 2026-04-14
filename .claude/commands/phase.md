Show current phase status: tasks progress and coverage gate.

## Steps

1. Read all task files in `tasks/` and count:
   - TODO / IN_PROGRESS / DONE / BLOCKED tasks per phase

2. Check coverage gate status (run /coverage internally)

3. Output:

```
Phase Status Report
═══════════════════════════════════════

Phase 1 — MVP  [ACTIVE | COMPLETE | LOCKED]
  Tasks:  XX done / YY total  (ZZ%)
  FE:     XX done / YY
  BE:     XX done / YY
  Coverage gate: >60%   → current: XX%  ✓/✗

Phase 2 — [PENDING | ACTIVE | COMPLETE]
  Tasks:  XX done / YY total
  Coverage gate: >70%

Phase 3 — [PENDING | ACTIVE | COMPLETE]
  Tasks:  XX done / YY total
  Coverage gate: >85%

Overall coverage target (project complete): 100%
```

4. If any phase is COMPLETE (all tasks done + gate passed), output:
   "Phase N complete. Ready to start Phase N+1."

5. If a task is BLOCKED, list it with the blocker note.

## Phase Transition Rules
- Cannot start Phase 2 until Phase 1 gate (>60%) passes
- Cannot start Phase 3 until Phase 2 gate (>70%) passes
- Project is "shippable" only at 100% coverage + all tasks DONE
