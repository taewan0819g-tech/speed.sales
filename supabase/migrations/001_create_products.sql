-- Speed.Sales MVP: products table
create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  product_name text not null,
  material text,
  size text,
  handmade boolean default false,
  origin text,
  key_features text,
  tone text,
  target_platforms text[] default '{}',
  created_at timestamptz default now()
);
