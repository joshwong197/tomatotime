-- HuntingTime: Cloud sync schema
-- Single table approach: store all user data as a JSON blob per user.
-- This mirrors the localStorage model exactly and avoids complex schema mapping.

create table if not exists user_data (
  user_id uuid references auth.users(id) on delete cascade primary key,
  seeds jsonb not null default '[]'::jsonb,
  archived_seeds jsonb not null default '[]'::jsonb,
  garden_beds jsonb not null default '[]'::jsonb,
  plant_sprites jsonb not null default '[]'::jsonb,
  daily_stats jsonb not null default '{}'::jsonb,
  history jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

-- Row Level Security: users can only access their own data
alter table user_data enable row level security;

create policy "Users can read own data"
  on user_data for select
  using (auth.uid() = user_id);

create policy "Users can insert own data"
  on user_data for insert
  with check (auth.uid() = user_id);

create policy "Users can update own data"
  on user_data for update
  using (auth.uid() = user_id);

create policy "Users can delete own data"
  on user_data for delete
  using (auth.uid() = user_id);
