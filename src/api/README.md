# Data layer

`src/api/` is the only code that touches data. Screens call `useBackend()` and get `{ db, session, user, api }`.

There are two backends with the same interface:

| Backend | When | Where the data lives | Who enforces the rules |
| --- | --- | --- | --- |
| Local (`local.js`) | `VITE_STRIDE_BACKEND` unset (the static demo) | This browser's localStorage (`stride-db`, `stride-session`) | `rules.js`, in the browser |
| Server (`remote.js`) | `VITE_STRIDE_BACKEND=server` | Supabase Postgres, through `POST /api/rpc` | `rules.js`, on the server (`server/handler.js`) |

Both run the same `rules.js`, so `local.test.js` is the spec for both. `server/handler.test.js` covers what only the server does: sessions, salted hashes, and sending each user only their own rows.

## Files

| File | What it does |
| --- | --- |
| `index.jsx` | Picks the backend; exports `BackendProvider`, `useBackend()` and `attempt()` |
| `rules.js` | Every write and its access rules. Throws `ApiError` with a message a person can read |
| `local.js` | `createLocalBackend({ storage, now })`: the database in localStorage |
| `remote.js` | `createRemoteBackend()`: calls `/api/rpc`, keeps the session token, refreshes every 20 seconds |
| `seed.js` | `createSeed(today, hash)`, `hashSecret()`, `demoLogins`, `DB_VERSION` |
| `selectors.js` | Pure read helpers over a snapshot |
| `dates.js` | Calendar-day helpers. Weeks run Monday to Sunday |
| `../../server/` | The server: `handler.js`, `visibility.js` (who may read what), `supabase-store.js`, `schema.js`, `passwords.js` |
| `../../api/rpc.js` | The Vercel function that wraps `server/handler.js` |
| `../../supabase/migrations/0001_stride.sql` | Tables, indexes and row level security |

## How a call works

1. A screen calls `api.requestClub('robotics')`.
2. **Local:** `commit()` copies the database with `structuredClone`, runs the rule, saves, and notifies subscribers.
   **Server:** `remote.js` posts `{ method, args }` with `Authorization: Bearer <token>`. The handler loads the database, runs the same rule on a copy, writes only the rows that changed, and replies with the rows this user may see.
3. A broken rule throws `ApiError`. `attempt(promise)` turns it into a message the screen shows inline.

## Roles

- **Guardian** signs in with a phone number or email and a password. They create teen accounts, approve club requests, change permissions, and read (never send) messages.
- **Teen** signs in with a username and a 4-digit PIN that their guardian set. They ask to join clubs, do lesson tasks and message mentors, within what their guardian allowed.
- **Mentor** (club leaders too) signs in with the account Stride gave them. They confirm tasks, mark registers, publish lessons and message their teens. They see nicknames only.

## Schema

Each collection is an object keyed by `id` in the browser, and a Postgres table on the server. `server/schema.js` maps camelCase fields to snake_case columns. Display-only fields go in each row's `extra` jsonb column.

| Collection | Key fields |
| --- | --- |
| `users` | `role, login, secret, name`. Guardian: `contact, relation, verifiedBy, verifiedAt`. Teen: `surname, nickname, dob, guardianId, mentorId, color, interests, goal, routine, paused, quietHours, consent, consentLog`. Mentor: `mentorId` (their profile) |
| `mentors` | public profile, `userId`, `listed` |
| `clubs` | catalogue fields, `mentorId` (the leader), `cost`, `spots` |
| `lessons` | catalogue fields, `mentorId`, `club`, `steps`, `badge`, `image`, `videoUrl`, `createdAt` |
| `memberships` | `teenId, clubId, since, requestId` |
| `requests` | `teenId, clubId, status (pending, approved, declined), createdAt, decidedAt, decidedBy` |
| `attendance` | `teenId, clubId, date, confirmedBy, at` |
| `tasks` | `teenId, lessonId, steps, status (draft, submitted, confirmed, returned), submittedAt, reviewedAt, reviewedBy, note` |
| `badges` | `teenId, name, mentorId, clubId, lessonId, at` |
| `messages` | `teenId, mentorId, from (teen or mentor; column "sender"), text, at, readAt` |
| `reports` | `by (column "reporter_id"), role, teenId, mentorId, reason, text, at, status` |
| `sessions` | server only: `token_hash, user_id, expires_at` |

## Security on the server

- The browser never talks to Supabase. Only `/api/rpc` does, with the service role key, which never leaves the server.
- Every table has row level security turned on with no policies, so the public anon key can read and write nothing.
- Passwords and PINs are stored as salted scrypt hashes. Session tokens are random and stored as SHA-256 hashes.
- `server/visibility.js` decides what each person receives. A guardian gets only their own family. A mentor gets their own threads, plus nickname-only rows for their mentees and club members. Secrets are never sent.
- Reset demo data works only when `STRIDE_ALLOW_RESET=true`.

## Known limits of this version

- Each request reads every table, then writes only what changed. That's fine for a pilot with hundreds of families. For more, move each rule's reads to targeted queries (or Postgres functions), using `local.test.js` as the spec.
- Writes to several tables aren't in one transaction. Two people changing the same row at the same moment means the last write wins.
- Dates use the server's clock (UTC on Vercel). Close to midnight in Harare, "today" can still be yesterday.
- New messages arrive by polling every 20 seconds. Supabase Realtime could push them instead.
