-- Product images and separate generated_contents table (Artisan update)

-- Add image URLs to products
alter table public.products
  add column if not exists image_urls text[] default '{}';

-- Table: one row per product with generated copy (join-friendly)
create table if not exists public.generated_contents (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  contents jsonb not null default '{}',
  created_at timestamptz default now(),
  unique(product_id)
);

create index if not exists generated_contents_product_id_idx
  on public.generated_contents (product_id);

alter table public.generated_contents enable row level security;

-- Users can view generated_contents for their own products only
create policy "Users can view own product contents"
  on public.generated_contents for select
  using (
    exists (
      select 1 from public.products p
      where p.id = generated_contents.product_id and p.user_id = auth.uid()
    )
  );

create policy "Users can insert own product contents"
  on public.generated_contents for insert
  with check (
    exists (
      select 1 from public.products p
      where p.id = generated_contents.product_id and p.user_id = auth.uid()
    )
  );

create policy "Users can update own product contents"
  on public.generated_contents for update
  using (
    exists (
      select 1 from public.products p
      where p.id = generated_contents.product_id and p.user_id = auth.uid()
    )
  );

-- Storage bucket 'product-images': create in Supabase Dashboard (Storage > New bucket)
-- Name: product-images, set Public to allow public read for image URLs.
-- Then add policies in Dashboard (Storage > product-images > Policies) or run:
--
-- allow authenticated users to upload:
-- create policy "Authenticated upload product-images"
--   on storage.objects for insert to authenticated
--   with check (bucket_id = 'product-images');
--
-- allow public read (for displaying images in app):
-- create policy "Public read product-images"
--   on storage.objects for select to public
--   using (bucket_id = 'product-images');
