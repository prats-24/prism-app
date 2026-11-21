-- Flexible, user-owned entries used by Notes, reflections, fitness, academics,
-- the AI Engineering roadmap and the personal Library.
create table if not exists public.prism_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  section text not null check (section in ('notes','reflections','fitness','scaler','iitm','library','insights','ai-engineering')),
  kind text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists prism_entries_user_section_created_idx
  on public.prism_entries (user_id, section, created_at desc);
alter table public.prism_entries enable row level security;
drop policy if exists prism_entries_own on public.prism_entries;
create policy prism_entries_own on public.prism_entries for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Private personal uploads. Object paths begin with the authenticated user id.
insert into storage.buckets (id, name, public, file_size_limit)
values ('prism-files', 'prism-files', false, 12582912)
on conflict (id) do update set public = false, file_size_limit = 12582912;
drop policy if exists prism_files_read_own on storage.objects;
drop policy if exists prism_files_insert_own on storage.objects;
drop policy if exists prism_files_delete_own on storage.objects;
create policy prism_files_read_own on storage.objects for select to authenticated
  using (bucket_id = 'prism-files' and (storage.foldername(name))[1] = auth.uid()::text);
create policy prism_files_insert_own on storage.objects for insert to authenticated
  with check (bucket_id = 'prism-files' and (storage.foldername(name))[1] = auth.uid()::text);
create policy prism_files_delete_own on storage.objects for delete to authenticated
  using (bucket_id = 'prism-files' and (storage.foldername(name))[1] = auth.uid()::text);
