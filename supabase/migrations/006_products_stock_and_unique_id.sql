-- Add stock and unique_id to products for Orders & Stock / Studio Log
alter table public.products
  add column if not exists stock_count int not null default 0,
  add column if not exists unique_id text;

create unique index if not exists products_user_unique_id_key
  on public.products (user_id, unique_id)
  where unique_id is not null;

comment on column public.products.stock_count is 'Inventory quantity for Orders & Stock.';
comment on column public.products.unique_id is 'Optional stable ID/SKU. Unique per user.';
