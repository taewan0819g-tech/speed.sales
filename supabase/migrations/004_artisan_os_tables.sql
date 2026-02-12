-- Artisan OS: inventory, orders, expenses, daily_logs
-- All tables are per-user; RLS enabled.

-- 1. Inventory (product catalog with stock)
create table if not exists public.inventory (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  stock_count int not null default 0,
  price int not null,
  status text not null default 'active' check (status in ('active', 'discontinued')),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists inventory_user_id_idx on public.inventory (user_id);

alter table public.inventory enable row level security;

create policy "Users can view own inventory"
  on public.inventory for select
  using (auth.uid() = user_id);

create policy "Users can insert own inventory"
  on public.inventory for insert
  with check (auth.uid() = user_id);

create policy "Users can update own inventory"
  on public.inventory for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete own inventory"
  on public.inventory for delete
  using (auth.uid() = user_id);

-- 2. Orders (Sales Ledger)
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  customer_name text not null,
  channel text not null check (channel in ('Instagram', 'Naver', 'Offline')),
  product_id uuid not null references public.inventory(id) on delete restrict,
  quantity int not null check (quantity > 0),
  total_price int not null,
  status text not null default 'paid' check (status in ('paid', 'shipping', 'completed', 'refunded')),
  delivery_address text
);

create index if not exists orders_user_id_created_at_idx on public.orders (user_id, created_at desc);
create index if not exists orders_product_id_idx on public.orders (product_id);

alter table public.orders enable row level security;

create policy "Users can view own orders"
  on public.orders for select
  using (auth.uid() = user_id);

create policy "Users can insert own orders"
  on public.orders for insert
  with check (auth.uid() = user_id);

create policy "Users can update own orders"
  on public.orders for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete own orders"
  on public.orders for delete
  using (auth.uid() = user_id);

-- 3. Expenses (Cost Ledger)
create table if not exists public.expenses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  date date not null,
  description text not null,
  amount int not null,
  category text not null check (category in ('material', 'shipping', 'marketing', 'etc')),
  created_at timestamptz default now()
);

create index if not exists expenses_user_id_date_idx on public.expenses (user_id, date desc);

alter table public.expenses enable row level security;

create policy "Users can view own expenses"
  on public.expenses for select
  using (auth.uid() = user_id);

create policy "Users can insert own expenses"
  on public.expenses for insert
  with check (auth.uid() = user_id);

create policy "Users can update own expenses"
  on public.expenses for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete own expenses"
  on public.expenses for delete
  using (auth.uid() = user_id);

-- 4. Daily logs (Natural Language History)
create table if not exists public.daily_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  content text not null,
  ai_response text
);

create index if not exists daily_logs_user_id_created_at_idx on public.daily_logs (user_id, created_at desc);

alter table public.daily_logs enable row level security;

create policy "Users can view own daily_logs"
  on public.daily_logs for select
  using (auth.uid() = user_id);

create policy "Users can insert own daily_logs"
  on public.daily_logs for insert
  with check (auth.uid() = user_id);

create policy "Users can update own daily_logs"
  on public.daily_logs for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete own daily_logs"
  on public.daily_logs for delete
  using (auth.uid() = user_id);
