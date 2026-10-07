-- EasyABC single product image setup

-- 1) Add one public product-image path to each product.
alter table public.products
add column if not exists image_path text;

-- 2) Create a PUBLIC bucket for storefront product images.
-- Downloadable apps remain in the PRIVATE digital-products bucket.
insert into storage.buckets (id, name, public)
values ('product-media', 'product-media', true)
on conflict (id)
do update set public = true;

-- 3) Allow only whitelisted EasyABC admins to upload/change/delete product images.
drop policy if exists "admins manage product media" on storage.objects;

create policy "admins manage product media"
on storage.objects
for all
to authenticated
using (
  bucket_id = 'product-media'
  and public.is_admin()
)
with check (
  bucket_id = 'product-media'
  and public.is_admin()
);

-- Optional explicit read policy for authenticated/anonymous API reads.
-- The bucket itself is public, so storefront public URLs work without authentication.
drop policy if exists "public read product media" on storage.objects;

create policy "public read product media"
on storage.objects
for select
to anon, authenticated
using (
  bucket_id = 'product-media'
);
