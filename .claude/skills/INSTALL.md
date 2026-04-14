# Skills

## Pre-installed (vendor/)
All skills are already in `.claude/skills/vendor/` — no installation needed.
See `vendor/INDEX.md` for what's available and when to use each file.

## How to load a vendor skill
```
"წაიკითხე .claude/skills/vendor/callstack-rn/react-native-best-practices.md"
```
Load only what's needed for the current task — not all at once.

## If a skill needs updating
```bash
# Re-clone and copy the specific file
git clone --depth=1 https://github.com/[repo].git /tmp/skill-tmp
cp /tmp/skill-tmp/[path/to/SKILL.md] .claude/skills/vendor/[category]/[name].md
rm -rf /tmp/skill-tmp
```
