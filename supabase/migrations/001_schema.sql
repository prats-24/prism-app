-- PRISM Phase 1 schema. Every user-owned table has RLS: user_id = auth.uid().
create extension if not exists pgcrypto;

create table public.profiles (
  id uuid primary key references auth.users on delete cascade,
  display_name text, avatar_url text, intro text,
  academic_goals text, learning_goals text, fitness_goals text,
  daily_focus_minutes int not null default 240,
  timezone text not null default 'Asia/Kolkata',
  onboarded boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.user_settings (
  user_id uuid primary key references auth.users on delete cascade,
  theme text not null default 'light' check (theme in ('light','dark')),
  accent text not null default '#8CBCEB',
  font text not null default 'geist',
  font_scale numeric not null default 1,
  focus jsonb not null default '{"focus":50,"short":10,"long":20}',
  layout jsonb not null default '{}',
  updated_at timestamptz not null default now()
);

create table public.tracks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  slug text not null, name text not null, description text,
  icon text, color text, kind text not null default 'custom' check (kind in ('builtin','custom')),
  target_date date, sort int not null default 0,
  unique (user_id, slug)
);

create table public.dsa_weeks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  week_no int not null, title text not null,
  starts_on date, ends_on date,
  dsa_hours numeric not null default 0, ai_hours numeric not null default 0,
  ai_focus text, sort int not null default 0
);

create table public.dsa_topics (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  week_id uuid not null references public.dsa_weeks on delete cascade,
  title text not null,
  status text not null default 'not_started' check (status in ('not_started','in_progress','done')),
  est_hours numeric not null default 0, actual_hours numeric not null default 0,
  notes text, sort int not null default 0
);

-- Global, read-only reference curriculum (the 54 RL topics from the supplied PDF).
create table public.rl_topics (
  number int primary key check (number between 1 and 54),
  title text not null,
  phase text not null check (phase in ('classical','advanced','llm_research')),
  resources jsonb not null,
  project text not null
);

create table public.rl_progress (
  user_id uuid not null references auth.users on delete cascade,
  topic_number int not null references public.rl_topics(number),
  status text not null default 'not_started' check (status in ('not_started','in_progress','done')),
  completion int not null default 0 check (completion between 0 and 100),
  project_done boolean not null default false,
  revision_status text not null default 'none' check (revision_status in ('none','due','revised')),
  est_hours numeric not null default 0, actual_hours numeric not null default 0,
  notes text,
  primary key (user_id, topic_number)
);

create table public.habits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  name text not null, description text, icon text, category text,
  frequency text not null default 'daily', target int not null default 1,
  sort int not null default 0, archived boolean not null default false
);

create table public.habit_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  habit_id uuid not null references public.habits on delete cascade,
  log_date date not null,
  unique (habit_id, log_date)
);

create table public.focus_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users on delete cascade,
  track_slug text,
  session_type text not null check (session_type in ('focus','short_break','long_break')),
  planned_seconds int not null,
  started_at timestamptz not null, ended_at timestamptz,
  duration_seconds int not null default 0,
  completed boolean not null default false
);
create index on public.focus_sessions (user_id, started_at);

-- Row Level Security
do $$
declare t text;
begin
  foreach t in array array['tracks','dsa_weeks','dsa_topics','rl_progress','habits','habit_logs','focus_sessions'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('create policy "%1$s_own" on public.%1$I for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid())', t);
  end loop;
end $$;

alter table public.profiles enable row level security;
create policy profiles_own on public.profiles for all to authenticated using (id = auth.uid()) with check (id = auth.uid());
alter table public.user_settings enable row level security;
create policy settings_own on public.user_settings for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
alter table public.rl_topics enable row level security;
create policy rl_topics_read on public.rl_topics for select to authenticated using (true);

-- Storage: private-by-folder avatar bucket (path = <user_id>/<file>)
insert into storage.buckets (id, name, public) values ('avatars','avatars',true) on conflict do nothing;
create policy avatars_read on storage.objects for select using (bucket_id = 'avatars');
create policy avatars_write on storage.objects for insert to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
create policy avatars_update on storage.objects for update to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
