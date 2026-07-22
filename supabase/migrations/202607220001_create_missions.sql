create table if not exists public.missions (
  id text primary key,
  owner_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  document jsonb not null,
  updated_at timestamptz not null,
  created_at timestamptz not null default now()
);

create index if not exists missions_owner_updated_idx
  on public.missions (owner_id, updated_at desc);

alter table public.missions enable row level security;

revoke all on table public.missions from anon;
grant select, insert, update, delete on table public.missions to authenticated;

create policy "mission owners can read"
  on public.missions for select to authenticated
  using ((select auth.uid()) = owner_id);

create policy "mission owners can insert"
  on public.missions for insert to authenticated
  with check ((select auth.uid()) = owner_id);

create policy "mission owners can update"
  on public.missions for update to authenticated
  using ((select auth.uid()) = owner_id)
  with check ((select auth.uid()) = owner_id);

create policy "mission owners can delete"
  on public.missions for delete to authenticated
  using ((select auth.uid()) = owner_id);
