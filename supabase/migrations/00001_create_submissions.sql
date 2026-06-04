create table submissions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  company text not null,
  position text not null,
  job_url text,
  resume_url text,
  cover_letter_url text,
  status text not null default 'sent' check (status in ('sent', 'interviewing', 'rejected', 'offer', 'accepted')),
  applied_at date not null default current_date,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table submissions enable row level security;

create policy "Users can view their own submissions"
  on submissions for select
  using (auth.uid() = user_id);

create policy "Users can insert their own submissions"
  on submissions for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own submissions"
  on submissions for update
  using (auth.uid() = user_id);

create policy "Users can delete their own submissions"
  on submissions for delete
  using (auth.uid() = user_id);

create index submissions_user_id_idx on submissions (user_id);
create index submissions_status_idx on submissions (status);
create index submissions_applied_at_idx on submissions (applied_at);
