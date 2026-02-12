-- Operations Log: internal notes, production requests, business records (not customer CS)
create table if not exists public.operations_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  content text not null,
  kind text not null default 'note' check (kind in ('note', 'request', 'reminder'))
);

create index if not exists operations_logs_user_id_created_at_idx on public.operations_logs (user_id, created_at desc);

alter table public.operations_logs enable row level security;

create policy "Users can view own operations_logs"
  on public.operations_logs for select
  using (auth.uid() = user_id);

create policy "Users can insert own operations_logs"
  on public.operations_logs for insert
  with check (auth.uid() = user_id);

create policy "Users can update own operations_logs"
  on public.operations_logs for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete own operations_logs"
  on public.operations_logs for delete
  using (auth.uid() = user_id);
