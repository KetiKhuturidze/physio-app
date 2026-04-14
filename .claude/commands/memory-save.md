Save current session to memory vault. Run at end of each session.

## Steps

1. Read `memory/INDEX.md`

2. Create `memory/sessions/YYYY-MM-DD.md` using template:
```
# Session — [date]
## Tasks Completed
- [list]
## Tasks Started
- [list]
## Decisions Made
- [list]
## Bugs Fixed
- [list]
## Next Session: Start With
- [top priority]
```

3. Update `memory/INDEX.md`:
   - Update "Current Phase" + "Last session" date
   - Add session to Sessions list (prepend, max 10 entries)
   - Update "Next task" based on /phase output
   - Add any new decisions or bug patterns (1 line each)

4. If a bug pattern was documented this session → also create `memory/bugs/YYYY-MM-DD-[topic].md`

5. Confirm: "Session saved → memory/sessions/YYYY-MM-DD.md"

## Keep INDEX.md under 50 lines
If it grows past 50 lines: archive oldest session entries (keep last 5), move old decisions to archive.
