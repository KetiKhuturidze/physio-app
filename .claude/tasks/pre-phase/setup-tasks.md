# Pre-Phase — Setup Tasks

## S-001 — Dependencies
```bash
# project root-ში
npm install
```
მოსალოდნელი დრო: 2-3 წუთი.
წარმატება: `node_modules/` გამოჩნდა, 0 errors.

---

## S-002 — Supabase Local
```bash
# Supabase CLI ინსტალაცია (ერთხელ)
npm install -g supabase

# local instance გაშვება
supabase start
```
წარმატება: local URL + anon key დაბეჭდავს.
შემდეგი: ეს მნიშვნელობები `.env`-ში ჩასვი (`.env.example` გამოიყენე template-ად).

---

## S-003 — Migrations
```bash
supabase db reset
```
წარმატება: `supabase/migrations/` ყველა migration სუფთად გადის.

---

## S-004 — App გაშვება
```bash
npx expo start
```
`i` — iOS Simulator, `a` — Android Emulator.
წარმატება: app გაიხსნება Simulator-ზე.

---

## S-005 — Obsidian
1. გადმოწერე [Obsidian](https://obsidian.md)
2. "Open folder as vault" → `physio-app/memory/`
3. `INDEX.md` გაიხსნება — ეს session memory-ია

---

## .env Setup
```bash
cp .env.example .env
```
შეავსე `.env` Supabase-ის local URL-ებით (S-002-ის output-იდან).
Google Maps key — Phase 1 FE-009-მდე არ სჭირდება.
