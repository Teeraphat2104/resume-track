create table gmail_connections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  access_token text not null,
  refresh_token text not null,
  token_expires_at timestamptz not null,
  email text not null,
  sync_enabled boolean not null default true,
  last_sync_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id)
);

create table gmail_sync_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  gmail_message_id text not null,
  submission_id uuid references submissions(id) on delete set null,
  action text not null check (action in ('created', 'updated', 'skipped')),
  summary text,
  synced_at timestamptz not null default now(),
  unique(user_id, gmail_message_id)
);

alter table gmail_connections enable row level security;
alter table gmail_sync_logs enable row level security;

create policy "Users can view their own gmail connection"
  on gmail_connections for select
  using (auth.uid() = user_id);

create policy "Users can insert their own gmail connection"
  on gmail_connections for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own gmail connection"
  on gmail_connections for update
  using (auth.uid() = user_id);

create policy "Users can delete their own gmail connection"
  on gmail_connections for delete
  using (auth.uid() = user_id);

create policy "Users can view their own sync logs"
  on gmail_sync_logs for select
  using (auth.uid() = user_id);

create policy "Users can insert sync logs"
  on gmail_sync_logs for insert
  with check (auth.uid() = user_id);

create index gmail_connections_user_id_idx on gmail_connections (user_id);
create index gmail_sync_logs_user_id_idx on gmail_sync_logs (user_id);
create index gmail_sync_logs_message_id_idx on gmail_sync_logs (gmail_message_id);
