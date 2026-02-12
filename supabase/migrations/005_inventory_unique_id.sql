-- Add optional unique_id to inventory for stable product identity
alter table public.inventory
  add column if not exists unique_id text;

create unique index if not exists inventory_user_unique_id_key
  on public.inventory (user_id, unique_id)
  where unique_id is not null;

comment on column public.inventory.unique_id is 'Optional stable ID for the product (e.g. SKU). Unique per user.';
