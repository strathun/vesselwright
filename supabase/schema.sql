-- Vesselwright cloud saves. Run once in Supabase: Dashboard -> SQL Editor -> New query -> Run.
-- Same project as strathun.github.io. One row per user holds the whole save.

create table if not exists vesselwright_saves (
  user_id uuid primary key references auth.users(id) on delete cascade,
  data jsonb not null,
  version int not null default 2,
  updated_at timestamptz not null default now()
);

alter table vesselwright_saves enable row level security;

create policy "Users can view own vesselwright save"
  on vesselwright_saves for select
  using (auth.uid() = user_id);

create policy "Users can insert own vesselwright save"
  on vesselwright_saves for insert
  with check (auth.uid() = user_id);

create policy "Users can update own vesselwright save"
  on vesselwright_saves for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete own vesselwright save"
  on vesselwright_saves for delete
  using (auth.uid() = user_id);
