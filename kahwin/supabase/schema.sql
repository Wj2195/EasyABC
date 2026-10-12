-- Kahwin v1 - run in Supabase SQL Editor. This migration does NOT modify EasyABC orders.
create table if not exists public.kahwin_couples (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 80),
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now()
);
create table if not exists public.kahwin_members (
  couple_id uuid not null references public.kahwin_couples(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('owner','partner')),
  joined_at timestamptz not null default now(),
  primary key (couple_id, user_id),
  unique (user_id)
);
create table if not exists public.kahwin_invites (
  code text primary key,
  couple_id uuid not null references public.kahwin_couples(id) on delete cascade,
  expires_at timestamptz not null,
  used_by uuid references auth.users(id),
  created_at timestamptz not null default now()
);
create table if not exists public.kahwin_subscriptions (
  couple_id uuid primary key references public.kahwin_couples(id) on delete cascade,
  plan text not null check (plan in ('monthly','yearly')),
  period_end timestamptz not null,
  updated_at timestamptz not null default now()
);
create table if not exists public.kahwin_payments (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.kahwin_couples(id) on delete cascade,
  requested_by uuid not null references auth.users(id),
  plan text not null check (plan in ('monthly','yearly')),
  amount_cents integer not null check ((plan='monthly' and amount_cents=500) or (plan='yearly' and amount_cents=5000)),
  bill_code text unique,
  status text not null default 'pending' check (status in ('pending','paid','failed')),
  provider_reference text,
  created_at timestamptz not null default now(),
  paid_at timestamptz
);
create table if not exists public.kahwin_budgets (
  couple_id uuid primary key references public.kahwin_couples(id) on delete cascade,
  amount numeric(12,2) not null default 0 check (amount>=0),
  updated_by uuid references auth.users(id),
  updated_at timestamptz not null default now()
);
create table if not exists public.kahwin_expenses (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.kahwin_couples(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 120),
  category text not null default 'Other' check (char_length(category) between 1 and 40),
  amount numeric(12,2) not null check (amount>=0),
  expense_date date not null default current_date,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now()
);
create table if not exists public.kahwin_tasks (
  id uuid primary key default gen_random_uuid(),
  couple_id uuid not null references public.kahwin_couples(id) on delete cascade,
  title text not null check (char_length(title) between 1 and 140),
  completed boolean not null default false,
  due_date date,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now()
);
create index if not exists kahwin_expenses_couple_date on public.kahwin_expenses(couple_id,expense_date desc);
create index if not exists kahwin_tasks_couple on public.kahwin_tasks(couple_id);

-- SECURITY DEFINER membership checks prevent recursive RLS evaluation.
create or replace function public.kahwin_is_member(p_couple uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists(select 1 from public.kahwin_members m where m.couple_id=p_couple and m.user_id=(select auth.uid()));
$$;
create or replace function public.kahwin_can_edit(p_couple uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select public.kahwin_is_member(p_couple) and exists (
    select 1 from public.kahwin_subscriptions s where s.couple_id=p_couple and s.period_end>now()
  );
$$;

alter table public.kahwin_couples enable row level security;
alter table public.kahwin_members enable row level security;
alter table public.kahwin_invites enable row level security;
alter table public.kahwin_subscriptions enable row level security;
alter table public.kahwin_payments enable row level security;
alter table public.kahwin_budgets enable row level security;
alter table public.kahwin_expenses enable row level security;
alter table public.kahwin_tasks enable row level security;

drop policy if exists kahwin_couples_read on public.kahwin_couples;
create policy kahwin_couples_read on public.kahwin_couples for select to authenticated using (public.kahwin_is_member(id));
drop policy if exists kahwin_members_read on public.kahwin_members;
create policy kahwin_members_read on public.kahwin_members for select to authenticated using (public.kahwin_is_member(couple_id));
drop policy if exists kahwin_subscriptions_read on public.kahwin_subscriptions;
create policy kahwin_subscriptions_read on public.kahwin_subscriptions for select to authenticated using (public.kahwin_is_member(couple_id));
drop policy if exists kahwin_payments_read on public.kahwin_payments;
create policy kahwin_payments_read on public.kahwin_payments for select to authenticated using (public.kahwin_is_member(couple_id));
drop policy if exists kahwin_budgets_read on public.kahwin_budgets;
create policy kahwin_budgets_read on public.kahwin_budgets for select to authenticated using (public.kahwin_is_member(couple_id));
drop policy if exists kahwin_budgets_insert on public.kahwin_budgets;
create policy kahwin_budgets_insert on public.kahwin_budgets for insert to authenticated with check (public.kahwin_can_edit(couple_id) and updated_by=auth.uid());
drop policy if exists kahwin_budgets_update on public.kahwin_budgets;
create policy kahwin_budgets_update on public.kahwin_budgets for update to authenticated using (public.kahwin_can_edit(couple_id)) with check (public.kahwin_can_edit(couple_id) and updated_by=auth.uid());
drop policy if exists kahwin_expenses_read on public.kahwin_expenses;
create policy kahwin_expenses_read on public.kahwin_expenses for select to authenticated using (public.kahwin_is_member(couple_id));
drop policy if exists kahwin_expenses_insert on public.kahwin_expenses;
create policy kahwin_expenses_insert on public.kahwin_expenses for insert to authenticated with check (public.kahwin_can_edit(couple_id) and created_by=auth.uid());
drop policy if exists kahwin_expenses_delete on public.kahwin_expenses;
create policy kahwin_expenses_delete on public.kahwin_expenses for delete to authenticated using (public.kahwin_can_edit(couple_id));
drop policy if exists kahwin_tasks_read on public.kahwin_tasks;
create policy kahwin_tasks_read on public.kahwin_tasks for select to authenticated using (public.kahwin_is_member(couple_id));
drop policy if exists kahwin_tasks_insert on public.kahwin_tasks;
create policy kahwin_tasks_insert on public.kahwin_tasks for insert to authenticated with check (public.kahwin_can_edit(couple_id) and created_by=auth.uid());
drop policy if exists kahwin_tasks_update on public.kahwin_tasks;
create policy kahwin_tasks_update on public.kahwin_tasks for update to authenticated using (public.kahwin_can_edit(couple_id)) with check (public.kahwin_can_edit(couple_id));
drop policy if exists kahwin_tasks_delete on public.kahwin_tasks;
create policy kahwin_tasks_delete on public.kahwin_tasks for delete to authenticated using (public.kahwin_can_edit(couple_id));

-- Entire paired household is created atomically, not with client INSERT privileges.
create or replace function public.kahwin_create_couple(p_name text) returns uuid
language plpgsql security definer set search_path = '' as $$
declare cid uuid; uid uuid := auth.uid();
begin
  if uid is null then raise exception 'Sign in first'; end if;
  if length(trim(coalesce(p_name,''))) not between 1 and 80 then raise exception 'Invalid couple name'; end if;
  if exists(select 1 from public.kahwin_members where user_id=uid) then raise exception 'Already paired'; end if;
  insert into public.kahwin_couples(name,created_by) values(trim(p_name),uid) returning id into cid;
  insert into public.kahwin_members(couple_id,user_id,role) values(cid,uid,'owner');
  return cid;
end; $$;

create or replace function public.kahwin_issue_invite(p_couple uuid) returns text
language plpgsql security definer set search_path = '' as $$
declare invite_code text; uid uuid := auth.uid();
begin
  if uid is null or not exists(select 1 from public.kahwin_members where couple_id=p_couple and user_id=uid and role='owner')
    then raise exception 'Only the first partner can invite'; end if;
  perform 1 from public.kahwin_couples where id=p_couple for update;
  if (select count(*) from public.kahwin_members where couple_id=p_couple)>=2 then raise exception 'Couple already has two members'; end if;
  delete from public.kahwin_invites where couple_id=p_couple and used_by is null;
  invite_code := upper(substr(replace(gen_random_uuid()::text,'-',''),1,12));
  insert into public.kahwin_invites(code,couple_id,expires_at) values(invite_code,p_couple,now()+interval '48 hours');
  return invite_code;
end; $$;

create or replace function public.kahwin_join_couple(p_code text) returns uuid
language plpgsql security definer set search_path = '' as $$
declare invited public.kahwin_invites%rowtype; uid uuid := auth.uid();
begin
  if uid is null then raise exception 'Sign in first'; end if;
  if exists(select 1 from public.kahwin_members where user_id=uid) then raise exception 'Already paired'; end if;
  select * into invited from public.kahwin_invites where code=upper(trim(p_code)) for update;
  if not found or invited.used_by is not null or invited.expires_at<=now()
    then raise exception 'Invalid or expired invitation'; end if;
  perform 1 from public.kahwin_couples where id=invited.couple_id for update;
  if (select count(*) from public.kahwin_members where couple_id=invited.couple_id)>=2 then raise exception 'Pair is full'; end if;
  insert into public.kahwin_members(couple_id,user_id,role) values(invited.couple_id,uid,'partner');
  update public.kahwin_invites set used_by=uid where code=invited.code;
  return invited.couple_id;
end; $$;

-- Called exclusively by the backend after a verified ToyyibPay transaction.
create or replace function public.kahwin_apply_payment(p_id uuid,p_reference text) returns boolean
language plpgsql security definer set search_path = '' as $$
declare p public.kahwin_payments%rowtype; old_end timestamptz; new_end timestamptz;
begin
  select * into p from public.kahwin_payments where id=p_id for update;
  if not found then raise exception 'Unknown payment'; end if;
  if p.status='paid' then return false; end if;
  perform 1 from public.kahwin_couples where id=p.couple_id for update;
  select period_end into old_end from public.kahwin_subscriptions where couple_id=p.couple_id for update;
  new_end := greatest(now(),coalesce(old_end,now())) +
    (case when p.plan='yearly' then interval '1 year' else interval '1 month' end);
  insert into public.kahwin_subscriptions(couple_id,plan,period_end)
    values(p.couple_id,p.plan,new_end)
  on conflict(couple_id) do update set plan=excluded.plan,period_end=excluded.period_end,updated_at=now();
  update public.kahwin_payments set status='paid',paid_at=now(),provider_reference=p_reference where id=p_id;
  return true;
end; $$;

revoke all on function public.kahwin_apply_payment(uuid,text) from public,anon,authenticated;
grant execute on function public.kahwin_apply_payment(uuid,text) to service_role;
revoke all on function public.kahwin_create_couple(text) from public,anon;
revoke all on function public.kahwin_issue_invite(uuid) from public,anon;
revoke all on function public.kahwin_join_couple(text) from public,anon;
grant execute on function public.kahwin_create_couple(text) to authenticated;
grant execute on function public.kahwin_issue_invite(uuid) to authenticated;
grant execute on function public.kahwin_join_couple(text) to authenticated;
grant execute on function public.kahwin_is_member(uuid) to authenticated;
grant execute on function public.kahwin_can_edit(uuid) to authenticated;
-- Realtime updates for paired phones.
do $$
begin
  if not exists (select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='kahwin_tasks')
    then alter publication supabase_realtime add table public.kahwin_tasks; end if;
  if not exists (select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='kahwin_expenses')
    then alter publication supabase_realtime add table public.kahwin_expenses; end if;
  if not exists (select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='kahwin_budgets')
    then alter publication supabase_realtime add table public.kahwin_budgets; end if;
  if not exists (select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='kahwin_subscriptions')
    then alter publication supabase_realtime add table public.kahwin_subscriptions; end if;
end $$;
