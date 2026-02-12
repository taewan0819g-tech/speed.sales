-- Point orders.product_id to products(id) so Studio Log can record sales
alter table public.orders
  drop constraint if exists orders_product_id_fkey;

alter table public.orders
  add constraint orders_product_id_fkey
  foreign key (product_id) references public.products(id) on delete restrict;
