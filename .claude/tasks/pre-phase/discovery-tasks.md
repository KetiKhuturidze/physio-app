# Pre-Phase — Discovery Tasks

## D-001 — Developer Background
Claude-ი ეკითხება:
- Tech background (backend / DevOps / სხვა)
- React / React Native გამოცდილება
- Supabase / BaaS გამოცდილება
- Claude Code გამოცდილება

---

## D-002 — Project Goals
Claude-ი ხსნის:
- ორი მხარე: patients + physios
- Tbilisi-ს districts — location matching
- MVP scope: არ არის payments, calendar, quiz
- Phase boundaries

---

## D-003 — Phase 1 Tasks Review
გაიარე `.claude/tasks/phase1-mvp/index.md` ერთად.
თითოეული task-ისთვის: scope სწორია? კლია? ამოვიღოთ?
თუ ცვლილება — task ფაილი განახლდება ადგილზე.

---

## D-004 — DB Schema
`CLAUDE.md`-ში Schema სექციის გავლა.
ძირითადი tables: users, physio_profiles, districts, bookings, reviews.
Relationships + RLS policy-ები.

---

## D-005 — E2E Flows
6 Maestro flow-ი დადასტურება:
1. Patient registration + login
2. Physio search by district
3. Physio profile view
4. Booking request (patient)
5. Booking confirm/decline (physio)
6. Review submission
