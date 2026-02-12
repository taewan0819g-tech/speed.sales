-- Add sold_count to products for Studio Log sell tracking
alter table public.products
  add column if not exists sold_count int not null default 0;

comment on column public.products.sold_count is 'Total units sold (incremented on each sale).';
