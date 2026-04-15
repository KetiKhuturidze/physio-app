# Getting Started — Physio App (Keto)

ეს გზამკვლევია. პირველ სესიაში გაუშვი `/start` — Claude-ი დანარჩენს გიხელმძღვანელებს.

---

## Claude Code — 3 წუთში

AI assistant ტერმინალიდან. ლაპარაკობ მასთან, ის კოდს წერს, ამოწმებს, ასწორებს.
შენ task ID-ს და direction-ს აძლევ, ის ყველაფერს წყვეტს.

| კარგი | ცუდი |
|-------|------|
| "დავიწყოთ FE-003" | "გააკეთე home screen" |
| "BE-004 hook-ი დავწეროთ" | "კოდი არ მუშაობს" |

---

## ინსტალაცია (ერთხელ)

```bash
npm install -g @anthropic-ai/claude-code
cd physio-app
npm install     # install project dependencies
cp .env.example .env  # then fill in Supabase local values
claude          # opens chat
/start          # onboarding begins
```

---

## Daily Routine

```bash
cd physio-app && claude
/phase                    # სად ხარ, რა task-ია შემდეგი
"დავიწყოთ FE-XXX"        # build session
/check                    # 0 errors → continue
/test                     # coverage gate ✓
/e2e                      # user flow ✓
/memory-save              # session ბოლოს — ყოველთვის
```

---

## Skills (pre-installed)

19 community skill ფაილი უკვე არის `.claude/skills/vendor/`-ში — Expo, Callstack RN, Caveman, GSD, Oh-My-ClaudeCode, Georgian Payments.
**ინსტალაცია არ სჭირდება.** Claude ავტომატურად გამოიყენებს საჭიროებისამებრ.
Reference: `.claude/skills/vendor/INDEX.md`

---

## Memory სისტემა (Obsidian)

Claude „ივიწყებს" სესიებს შორის. `memory/` vault-ი ამას წყვეტს.

**Setup (pre-phase S-006):**
1. გადმოწერე [Obsidian](https://obsidian.md) (უფასოა)
2. "Open folder as vault" → `physio-app/memory/`
3. `INDEX.md` გაიხსნება — ეს Claude-ის "short-term memory"-ია

**სესიის ბოლოს — ყოველთვის:**
```
/memory-save
```
Claude შეინახავს session notes-ს, INDEX.md-ს განაახლებს.
შემდეგ სესიაში INDEX.md-ს წაიკითხავს → იხსომებს სად ჩავჩერდი.

---

## Slash Commands (სრული სია)

| Command | მიზანი |
|---------|--------|
| `/start` | პირველი სესია — onboarding |
| `/phase` | Phase progress + coverage |
| `/check` | tsc + eslint |
| `/test` | jest + coverage gate |
| `/e2e` | Maestro E2E tests |
| `/coverage` | coverage report |
| `/new-task` | ახალი task |
| `/update-skill` | bug fix → skill file |
| `/memory-save` | session → memory vault |

---

## Phase სისტემა

Pre-Phase → Phase 1 (>60%) → Phase 2 (>70%) → Phase 3 (>85%) → 100%

Phase-ის გადასვლა = წინა gate გავლილი.

---

## Tech Stack ანალოგიებით

| Tech | ანალოგი |
|------|---------|
| React Native | React, mobile-ზე |
| Expo Router | Next.js routing |
| NativeWind | Tailwind CSS |
| Supabase | Postgres + REST + Auth + Storage |
| Maestro | Playwright, mobile-ზე |
| Zustand | Redux (გამარტივებული) |
