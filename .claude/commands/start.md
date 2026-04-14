პირველი გაშვება — project onboarding სესია.

გამოიყენე მხოლოდ პირველ სესიაში. შემდგომ სესიებში გამოიყენე `/phase`.

## Steps

### ნაბიჯი 1: წაიკითხე და გაიგე
წაიკითხე შემდეგი ფაილები ამ თანმიმდევრობით:
1. `CLAUDE.md` (root) — პროექტის სრული context
2. `docs/app-overview.html` — visual overview
3. `.claude/tasks/pre-phase/overview.md` — რა უნდა გაკეთდეს

### ნაბიჯი 2: გაეცანი Developer-ს
დაუსვი ეს კითხვები:

---
"გამარჯობა! სანამ დავიწყებთ, მინდა გავიგო შენი background:

1. რა stack-ზე გაქვს გამოცდილება? (backend? DevOps? სხვა?)
2. React-ი ან React Native — ოდესმე გამოგიყენებია?
3. Supabase ან სხვა BaaS — ნაცნობია?
4. Claude Code — პირველად იყენებ?

ეს დამეხმარება ახსნა იმ დონეზე მოვარგო რაც შენთვის ყველაზე სასარგებლოა."

---

### ნაბიჯი 3: პროექტი ახსენი Context-ის მიხედვით
Developer-ის background-ის მიხედვით ახსენი:
- რა პრობლემა აქვს ამ app-ს გადასაჭრელი (Georgian physio market, elderly patients)
- ორი მხარე: patients + physios — სხვადასხვა role, სხვადასხვა screens
- MVP-ი: no payments, no calendar — deliberately simple
- Phase boundaries: რა არის MVP-ში, რა — Phase 2-ში

თუ backend developer-ია: Supabase-ი ახსენი Postgres + REST API + Auth + Storage-ად
თუ DevOps-ია: Expo-ი ახსენი managed build pipeline-ად
ანალოგია ყოველთვის გამოიყენე

### ნაბიჯი 4: Setup
გაიარე setup tasks:
```
.claude/tasks/pre-phase/setup-tasks.md
```
თითოეული task-ისთვის:
- commands მოაწოდე სათითაოდ
- დაელოდე confirmation-ს
- error → მიზეზი + fix + გაგრძელება

### ნაბიჯი 5: Tasks Review სესია
```
"ახლა გავიაროთ Phase 1 tasks ერთად. მე გაჩვენებ თითოეულ task-ს,
შენ მეუბნები — სწორია scope? კლია რაიმე? ამოვიღოთ?"
```

გაიარე `.claude/tasks/pre-phase/discovery-tasks.md` — DISC-003
თითოეული FE/BE task-ისთვის:
- 2-3 წინადადებით ახსენი რა კეთდება
- ჰკითხე: "ეს გასაგებია? ჯდება project-ში?"
- თუ კომენტარი აქვს — task განაახლე ადგილზე

### ნაბიჯი 6: Schema Review
გაიარე `.claude/tasks/pre-phase/discovery-tasks.md` — DISC-004
DB schema მოკლედ ახსენი — ძირითადი tables + relationships

### ნაბიჯი 7: Pre-Phase Complete Check
```
.claude/tasks/pre-phase/overview.md
```
ყველა checkbox შემოწმება. DONE → Phase 1 შეიძლება დაიწყოს.

### ნაბიჯი 8: Phase 1 კიკოფი
```
"pre-phase დასრულებულია. პირველი task არის FE-001 ან BE-001.
 რომლიდან დავიწყოთ? ჩვეულებრივ BE-ით ვიწყებთ (schema → hooks → UI),
 მაგრამ შენი გადასაწყვეტია."
```

## Notes
- ეს სესია შეიძლება 1-2 საათი გაგრძელდეს — ნორმალურია
- ყველა კითხვა valid-ია, "stupid question" არ არსებობს
- Developer-ი tech-savvy-ია (5+ წელი) — არ ახსნა basics
- ახსენი React/Expo/Claude Code concepts, არა programming basics
