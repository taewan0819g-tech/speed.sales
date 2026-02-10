-- Add user_id and generated_contents for history and per-user data
alter table public.products
  add column if not exists user_id uuid references auth.users(id) on delete cascade,
  add column if not exists generated_contents jsonb default '{}';

-- Backfill: existing rows get null user_id (optional, or delete them)
-- create index for list by user
create index if not exists products_user_id_created_at_idx
  on public.products (user_id, created_at desc);

-- RLS: users see and manage only their own rows
alter table public.products enable row level security;

drop policy if exists "Users can view own products" on public.products;
create policy "Users can view own products"
  on public.products for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own products" on public.products;
create policy "Users can insert own products"
  on public.products for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own products" on public.products;
create policy "Users can update own products"
  on public.products for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
