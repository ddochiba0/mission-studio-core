alter table public.missions
  alter column document drop not null,
  add column if not exists deleted_at timestamptz;

create index if not exists missions_owner_deleted_idx
  on public.missions (owner_id, deleted_at)
  where deleted_at is not null;
