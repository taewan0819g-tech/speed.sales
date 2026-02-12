-- CS inquiries (customer questions, complaints, refund requests from Studio Log)
create table if not exists public.cs_inquiries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  customer_name text not null,
  content text not null,
  product_name text,
  status text not null default 'pending' check (status in ('pending', 'replied')),
  ai_reply text
);

create index if not exists cs_inquiries_user_id_created_at_idx on public.cs_inquiries (user_id, created_at desc);

alter table public.cs_inquiries enable row level security;

create policy "Users can view own cs_inquiries"
  on public.cs_inquiries for select
  using (auth.uid() = user_id);

create policy "Users can insert own cs_inquiries"
  on public.cs_inquiries for insert
  with check (auth.uid() = user_id);

create policy "Users can update own cs_inquiries"
  on public.cs_inquiries for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can delete own cs_inquiries"
  on public.cs_inquiries for delete
  using (auth.uid() = user_id);
