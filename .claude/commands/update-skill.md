Update or create a skill file based on a lesson learned during this session.

## When to run this command
Run `/update-skill` automatically after:
- Fixing a non-obvious TypeScript error
- Finding the correct Supabase query pattern after a failed attempt
- Discovering an Expo/React Native gotcha
- Fixing a NativeWind styling issue that wasn't obvious
- Resolving an RLS policy bug
- Any bug where the root cause was a knowledge gap, not a typo

Do NOT run for: simple typos, missing imports that are obvious, syntax errors.

## Usage
`/update-skill [skill-file] "[what was learned]"`

Examples:
- `/update-skill supabase "RLS policies don't apply to service role — Edge Functions bypass RLS by default"`
- `/update-skill react-native "FlashList requires estimatedItemSize prop or it renders at 0 height"`
- `/update-skill tdd "Supabase mock must reset between tests — use beforeEach(() => jest.clearAllMocks())"`

## Steps

1. Identify which skill file is most relevant:
   - `react-native.md` — RN, Expo, NativeWind, navigation
   - `supabase.md` — queries, RLS, auth, storage, edge functions
   - `tdd.md` — testing, mocks, coverage
   - `ui-ux.md` — styling, accessibility, Georgian UX

2. If no existing file fits → create `skills/[new-topic].md` with the standard header

3. Append to the relevant skill file under a `## Learned in Practice` section:

```markdown
## Learned in Practice

### [Short title of the lesson]
**Problem:** [What went wrong / what wasn't obvious]
**Root cause:** [Why it happened]
**Fix / Rule:** [The correct approach]
**Example:**
\`\`\`typescript
// wrong
...
// correct
...
\`\`\`
```

4. Confirm: "Skill updated: skills/[filename].md — '[lesson title]'"

## Auto-trigger rule
After ANY debugging session where a non-obvious fix was found:
1. Fix the bug
2. Run `/check` to confirm it's resolved
3. Run `/update-skill` immediately — before moving to the next task
4. Mark the original task's sub-task as done

This keeps the skill files current and prevents the same mistake in future sessions.
