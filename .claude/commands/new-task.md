Create a new structured task in the tasks/ directory.

## Usage
`/new-task [phase] [fe|be] [task name]`

Example: `/new-task phase1 fe PhysioCard component`

## Steps

1. Ask for (if not provided):
   - Phase: phase1-mvp | phase2 | phase3
   - Type: fe (frontend) | be (backend/supabase)
   - Name: short task name

2. Append to the correct file (`tasks/[phase]/fe-tasks.md` or `be-tasks.md`):

```markdown
## TASK-[auto-number]: [Task Name]
**Type:** FE | BE
**Phase:** [phase]
**Status:** TODO | IN_PROGRESS | DONE | BLOCKED
**Priority:** HIGH | MEDIUM | LOW

### Description
[What needs to be built]

### Acceptance Criteria
- [ ] [criterion 1]
- [ ] [criterion 2]

### Sub-tasks
- [ ] [sub-task 1]
- [ ] [sub-task 2]

### Test Requirements
- Unit: [what to unit test]
- E2E: [what Maestro flow covers this]

### Notes
[Dependencies, blockers, context]
```

3. Auto-increment task number based on existing tasks in both fe-tasks.md and be-tasks.md combined.

4. Confirm: "Task TASK-XX created in tasks/[phase]/[fe|be]-tasks.md"
