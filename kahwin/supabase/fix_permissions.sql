-- Kahwin permissions hotfix, 2026-10-12.
-- Run ONCE in EasyABC's Supabase SQL Editor as project administrator.
-- Safe to rerun; affects ONLY tables prefixed kahwin_.
-- PostgreSQL GRANTs and Supabase RLS policies are both required.

grant usage on schema public to authenticated;

-- No anonymous or PUBLIC grants on Kahwin account/customer records.
revoke all on table
  public.kahwin_couples,
  public.kahwin_members,
  public.kahwin_invites,
  public.kahwin_subscriptions,
  public.kahwin_payments,
  public.kahwin_budgets,
  public.kahwin_expenses,
  public.kahwin_tasks
from public, anon, authenticated;

-- Read-only data for signed-in couple members (RLS limits visible rows).
grant select on table
  public.kahwin_couples,
  public.kahwin_members,
  public.kahwin_subscriptions,
  public.kahwin_payments,
  public.kahwin_budgets,
  public.kahwin_expenses,
  public.kahwin_tasks
to authenticated;

-- Editing is further limited to current members with a paid plan by RLS.
grant insert, update on public.kahwin_budgets to authenticated;
grant insert, delete on public.kahwin_expenses to authenticated;
grant insert, update, delete on public.kahwin_tasks to authenticated;

-- Deliberately NO direct client writes to members, couples, invites,
-- subscriptions or payments. Use the restricted server functions instead.
-- Refresh Supabase's PostgREST API schema cache.
notify pgrst, 'reload schema';
