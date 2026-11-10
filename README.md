# Stride prototype

A mobile-first app that gives 12 to 17 year olds structured, supervised things to do: verified clubs, checked mentors and short lessons. A parent or guardian approves everything.

Built with React, Vite and a PWA service worker. Hash routing (`#/clubs`) means the front end runs on any static host. Teens, guardians and mentors each sign in to their own view. Data lives either in the browser (the offline demo) or in Supabase behind a Vercel function.

## Try it

```bash
npm install
npm run dev          # offline demo: data in this browser
npm run dev:server   # the server backend: /api/rpc with an in-memory database, or Supabase if .env.local has keys
npm test
```

Open the network link Vite prints on your phone (same Wi-Fi) to see it at real size.

### Demo accounts

| Who | Sign in with | PIN or password |
| --- | --- | --- |
| Tino, teen (14) | `tino` | `1234` |
| Chiedza Moyo, guardian of Tino and Rudo | `chiedza@example.com` | `stride` |
| Fabulous Lashid, mentor at Junior Coders | `fabulous` | `stride` |
| Farai Mapfumo, leads Football Academy | `farai` | `stride` |

Every other teen uses PIN `1234` (`rudo`, `ropa`, `kuda`, `tapiwa`, `farai.c`). Every mentor signs in with their profile id (`charlene`, `eric`, `simba`, `nyasha`, `ruvimbo`, `blessing`, `chipo`) and `stride`. The sign-in screen lists the main ones. Account, Reset demo data puts everything back.

### The demo loop

1. **Tino** asks to join a club, ticks off a lesson's steps and sends the task to Fabulous, then messages him.
2. **Chiedza** approves the club in Family. In Controls she can pause Tino or turn off messages, and each change is logged.
3. **Fabulous** confirms the badge, marks the Junior Coders register and publishes a new lesson.
4. **Tino** sees "Your guardian said yes", the new session on his streak, and the badge on his record.

## Accounts and roles

| Role | Signs in with | Can |
| --- | --- | --- |
| Guardian | phone or email, plus a password | Create teen accounts, approve clubs, set permissions, pause, read every message |
| Teen | username, plus a 4-digit PIN set by their guardian | Ask to join clubs, do lessons, message mentors, all within what their guardian allowed |
| Mentor or club leader | the account Stride gave them | Confirm tasks, mark registers, publish lessons, message their teens (nicknames only) |

Guardians sign up in the app (ID check, consent, then the teen's profile and PIN). Mentor accounts are made by Stride staff after vetting. In the demo they're seeded.

## Where the data lives

All data goes through `src/api/`. See [src/api/README.md](src/api/README.md) for the schema and rules.

- **Offline demo** (`VITE_STRIDE_BACKEND` unset): the database lives in this browser's localStorage. Good for showing the flow on one phone.
- **Server** (`VITE_STRIDE_BACKEND=server`): the browser calls `POST /api/rpc`, a Vercel function. It runs the same rules (`src/api/rules.js`) and keeps the data in Supabase Postgres. Each person receives only the rows they're allowed to see.

### Connect Supabase and deploy to Vercel

1. Create a Supabase project. In the SQL editor, run [`supabase/migrations/0001_stride.sql`](supabase/migrations/0001_stride.sql).
2. In Vercel, import this repository. Framework: Vite (detected).
3. In Vercel, Settings, Environment Variables, add:
   - `SUPABASE_URL`: from Supabase, Project Settings, API
   - `SUPABASE_SERVICE_ROLE_KEY`: same page. Keep it secret, and never prefix it with `VITE_`.
   - `VITE_STRIDE_BACKEND` = `server`
   - `STRIDE_ALLOW_RESET` = `true` while it's a demo
4. Redeploy. The first request seeds the demo accounts. `GET /api/rpc` returns `{"database":"supabase"}` once the keys are set.

For local development against Supabase, copy `.env.example` to `.env.local`, fill it in, and run `npm run dev:server`.

## Routes

| Role | Tabs | Other routes |
| --- | --- | --- |
| Teen | `#/today`, `#/clubs` (Discover), `#/learn`, `#/mentor` | `#/swipe`, `#/chat/<mentorId>` |
| Guardian | `#/guardian` (Family), `#/clubs`, `#/messages`, `#/account` | `#/guardian/controls`, `#/chat/<teenId>/<mentorId>` (read-only) |
| Mentor | `#/dashboard`, `#/teens`, `#/inbox`, `#/lessons` | `#/lessons/new`, `#/lessons/<id>/edit`, `#/chat/<teenId>`, `#/mentor` (own profile) |
| Everyone | | `#/club/<id>`, `#/lesson/<id>`, `#/mentor/<id>`, `#/account` |

## Where things live

- `src/api/`: the data layer (backends, rules, selectors, seed)
- `server/` and `api/rpc.js`: the server backend and its Vercel function
- `supabase/migrations/`: the database schema
- `src/screens/`: one file per screen. Mentor screens are in `src/screens/mentor/`, sign-up and sign-in in `src/screens/onboarding/`.
- `src/store.jsx`: per-device UI state only (filters, saved lessons, which teen a guardian is looking at)
- `src/data.js`: the club, lesson and mentor catalogue the seed is built from
- `src/styles.css`: design tokens at the top, then the styles for each part of the app

## Sample data

The names (Stride, Tino, Rudo, Fabulous Lashid) and the clubs are placeholders. Nothing here is real, and no impact numbers are claimed.

## Next steps

1. **Phone sign-in for guardians:** a one-time code by SMS or WhatsApp instead of a password.
2. **WhatsApp-first guardians:** approve by replying "YES". The server sends the weekly summary and respects quiet hours.
3. **QR check-in:** the leader shows a code and teens scan it, so the register fills itself and is harder to fake.
4. **Safeguarding tools for staff:** a reports queue, keyword flags in messages, and a way to vet and create mentor accounts.
5. **Shona and Ndebele, plus a low-data mode:** lessons download only on Wi-Fi, with compressed video.
6. **Lesson video upload** to Supabase Storage instead of pasting a link.
7. **A verified growth record** that schools and employers can check, and an impact dashboard for funders built from confirmed data.
