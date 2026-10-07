-- EasyABC secure admin setup
-- IMPORTANT: replace YOUR_ADMIN_EMAIL@example.com with the email you will use for admin login.

create table if not exists public.admin_users (
  email text primary key,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.admin_users enable row level security;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $$
  select exists (
    select 1
    from public.admin_users
    where active = true
      and lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;

-- Whitelist your admin email.
insert into public.admin_users (email, active)
values ('YOUR_ADMIN_EMAIL@example.com', true)
on conflict (email) do update set active = true;

-- Admin CRUD on categories
drop policy if exists "admins manage categories" on public.categories;
create policy "admins manage categories"
on public.categories
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

grant select, insert, update, delete on public.categories to authenticated;

-- Admin CRUD on products
drop policy if exists "admins manage products" on public.products;
create policy "admins manage products"
on public.products
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

grant select, insert, update, delete on public.products to authenticated;

-- Admin can view all orders
drop policy if exists "admins read all orders" on public.orders;
create policy "admins read all orders"
on public.orders
for select
to authenticated
using (public.is_admin());

grant select on public.orders to authenticated;

-- Admin can view all order items
drop policy if exists "admins read all order items" on public.order_items;
create policy "admins read all order items"
on public.order_items
for select
to authenticated
using (public.is_admin());

grant select on public.order_items to authenticated;

-- Needed for inserts into identity/serial tables.
grant usage, select on all sequences in schema public to authenticated;

-- Admin access to private digital product files.
drop policy if exists "admins manage digital product files" on storage.objects;
create policy "admins manage digital product files"
on storage.objects
for all
to authenticated
using (
  bucket_id = 'digital-products'
  and public.is_admin()
)
with check (
  bucket_id = 'digital-products'
  and public.is_admin()
);
