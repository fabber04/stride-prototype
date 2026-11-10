-- Stride schema. Run once in the Supabase SQL editor (or `supabase db push`).
-- The app reads and writes only through the /api/rpc server function, using the service role key.
-- Row level security is on for every table with no policies, so the anon key can do nothing.
-- Each table has an `extra` jsonb column for display fields that don't need their own column.

create table if not exists users (
  id text primary key,
  role text not null check (role in ('guardian', 'teen', 'mentor')),
  login text not null unique,
  secret text not null,
  name text not null,
  created_at timestamptz not null default now(),
  -- guardian
  contact text,
  relation text,
  verified_by text,
  verified_at timestamptz,
  -- teen
  surname text,
  nickname text,
  dob date,
  guardian_id text references users (id) on delete cascade deferrable initially deferred,
  mentor_id text, -- teen: matched mentor; mentor account: their profile
  color text,
  interests jsonb,
  goal int check (goal between 1 and 3),
  routine jsonb,
  paused boolean,
  quiet_hours boolean,
  consent jsonb,
  consent_log jsonb,
  extra jsonb not null default '{}'
);
create index if not exists users_guardian_idx on users (guardian_id);

create table if not exists mentors (
  id text primary key,
  user_id text references users (id) on delete set null deferrable initially deferred,
  listed boolean not null default false,
  name text not null,
  short text,
  first text,
  initials text,
  photo text,
  avatar text,
  role text,
  badge text,
  extra jsonb not null default '{}'
);

create table if not exists clubs (
  id text primary key,
  mentor_id text references mentors (id) on delete set null deferrable initially deferred,
  name text not null,
  type text,
  day int check (day between 0 and 6),
  time text,
  cost jsonb,
  spots int,
  extra jsonb not null default '{}'
);

create table if not exists lessons (
  id text primary key,
  mentor_id text references mentors (id) on delete cascade deferrable initially deferred,
  club text references clubs (id) on delete set null deferrable initially deferred,
  type text,
  title text not null,
  minutes int,
  task text,
  steps jsonb not null default '[]',
  badge text,
  image text,
  video_url text,
  created_at timestamptz not null default now(),
  extra jsonb not null default '{}'
);

create table if not exists memberships (
  id text primary key,
  teen_id text not null references users (id) on delete cascade deferrable initially deferred,
  club_id text not null references clubs (id) on delete cascade deferrable initially deferred,
  since date,
  request_id text,
  extra jsonb not null default '{}'
);
create index if not exists memberships_teen_idx on memberships (teen_id);
create index if not exists memberships_club_idx on memberships (club_id);

create table if not exists requests (
  id text primary key,
  teen_id text not null references users (id) on delete cascade deferrable initially deferred,
  club_id text not null references clubs (id) on delete cascade deferrable initially deferred,
  status text not null check (status in ('pending', 'approved', 'declined')),
  created_at timestamptz not null default now(),
  decided_at timestamptz,
  decided_by text,
  extra jsonb not null default '{}'
);
create index if not exists requests_teen_idx on requests (teen_id);

create table if not exists attendance (
  id text primary key,
  teen_id text not null references users (id) on delete cascade deferrable initially deferred,
  club_id text not null references clubs (id) on delete cascade deferrable initially deferred,
  date date not null,
  confirmed_by text,
  at timestamptz not null default now(),
  extra jsonb not null default '{}'
);
create index if not exists attendance_teen_idx on attendance (teen_id, date);

create table if not exists tasks (
  id text primary key,
  teen_id text not null references users (id) on delete cascade deferrable initially deferred,
  lesson_id text not null,
  steps jsonb not null default '{}',
  status text not null check (status in ('draft', 'submitted', 'confirmed', 'returned')),
  submitted_at timestamptz,
  reviewed_at timestamptz,
  reviewed_by text,
  note text,
  extra jsonb not null default '{}'
);
create index if not exists tasks_teen_idx on tasks (teen_id);

create table if not exists badges (
  id text primary key,
  teen_id text not null references users (id) on delete cascade deferrable initially deferred,
  name text not null,
  mentor_id text,
  club_id text,
  lesson_id text,
  at timestamptz not null default now(),
  extra jsonb not null default '{}'
);
create index if not exists badges_teen_idx on badges (teen_id);

create table if not exists messages (
  id text primary key,
  teen_id text not null references users (id) on delete cascade deferrable initially deferred,
  mentor_id text not null,
  sender text not null check (sender in ('teen', 'mentor')),
  text text not null check (char_length(text) <= 1000),
  at timestamptz not null default now(),
  read_at timestamptz,
  extra jsonb not null default '{}'
);
create index if not exists messages_thread_idx on messages (teen_id, mentor_id, at);

create table if not exists reports (
  id text primary key,
  reporter_id text,
  role text,
  teen_id text,
  mentor_id text,
  reason text not null,
  text text,
  at timestamptz not null default now(),
  status text not null default 'open',
  extra jsonb not null default '{}'
);

create table if not exists sessions (
  token_hash text primary key,
  user_id text not null references users (id) on delete cascade,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null
);
create index if not exists sessions_user_idx on sessions (user_id);

-- Lock everything down for the anon and authenticated keys. The service role bypasses RLS.
alter table users enable row level security;
alter table mentors enable row level security;
alter table clubs enable row level security;
alter table lessons enable row level security;
alter table memberships enable row level security;
alter table requests enable row level security;
alter table attendance enable row level security;
alter table tasks enable row level security;
alter table badges enable row level security;
alter table messages enable row level security;
alter table reports enable row level security;
alter table sessions enable row level security;
