-- EasyABC: 1-hour payment-bill window, non-destructive records & status audit.
-- Run once in Supabase SQL Editor. Existing orders/order_items are NEVER deleted.
-- Pending orders older than their deadline remain pending in the DB until
-- ToyyibPay reports a final outcome; admin UI archives them visually.
begin;

alter table public.orders
  add column if not exists expires_at timestamptz;

-- Historical orders: determine their original deadline from created_at.
update public.orders
set expires_at = created_at + interval '1 hour'
where expires_at is null;

alter table public.orders
  alter column expires_at set default (now() + interval '1 hour');

comment on column public.orders.expires_at is
  'EasyABC payment window ends 1 hour after creation. Provider expiry is separately enforced by ToyyibPay billExpiryDate. An expired pending order is not proof that a bank payment failed.';

create index if not exists orders_pending_expiry_idx
  on public.orders (expires_at)
  where status = 'pending';

create table if not exists public.order_status_events (
  id bigint generated always as identity primary key,
  order_id uuid not null references public.orders(id) on delete restrict,
  old_status text,
  new_status text not null,
  provider_ref text,
  changed_at timestamptz not null default now()
);

create index if not exists order_status_events_order_idx
  on public.order_status_events (order_id, changed_at desc);
alter table public.order_status_events enable row level security;
revoke all on public.order_status_events from anon, authenticated;
grant select on public.order_status_events to authenticated;

do $$
begin
  if to_regprocedure('public.is_admin()') is not null then
    execute 'drop policy if exists "admins read order status history" on public.order_status_events';
    execute 'create policy "admins read order status history" on public.order_status_events for select to authenticated using (public.is_admin())';
  end if;
end $$;

-- Never downgrade a fully paid bill just because a delayed failure callback
-- arrives out of order. A true refund needs a separate accounting process.
create or replace function public.easyabc_preserve_paid_status()
returns trigger language plpgsql set search_path = public as $$
begin
  if old.status = 'paid' and new.status <> 'paid' then
    new.status := 'paid';
    new.paid_at := old.paid_at;
    new.provider_ref := old.provider_ref;
  end if;
  if old.status = 'paid' and old.paid_at is not null then
    new.paid_at := old.paid_at;
  end if;
  return new;
end;
$$;

drop trigger if exists easyabc_preserve_paid_status on public.orders;
create trigger easyabc_preserve_paid_status
before update of status, paid_at on public.orders
for each row execute function public.easyabc_preserve_paid_status();

create or replace function public.easyabc_log_order_status_change()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if old.status is distinct from new.status then
    insert into public.order_status_events
      (order_id, old_status, new_status, provider_ref)
    values (new.id, old.status, new.status, new.provider_ref);
  end if;
  return new;
end;
$$;

drop trigger if exists easyabc_log_order_status_change on public.orders;
create trigger easyabc_log_order_status_change
after update of status on public.orders
for each row execute function public.easyabc_log_order_status_change();

commit;

-- Diagnostic only; run separately if desired:
-- select status,
--        count(*) as orders,
--        count(*) filter (where status = 'pending' and expires_at <= now()) as overdue_pending
-- from public.orders group by status order by status;
