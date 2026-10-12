-- Kahwin TESTING ONLY: temporary 7-day access for one couple.
-- Run in Supabase SQL Editor as project owner. Do NOT expose this in browser code.
-- Replace YOUR_LOGIN_EMAIL@example.com with the email used by the FIRST account
-- (the owner who clicked "Create space"). Not the invited partner's email.
-- This grants testing access WITHOUT a payment; it must not be used to fulfill sales.
-- The displayed plan will say "monthly", even though this is a no-charge test.
-- Existing non-expired subscriptions are never overwritten.

with owner_couple as (
  select m.couple_id
  from public.kahwin_members m
  join auth.users u on u.id = m.user_id
  where m.role = 'owner'
    and lower(u.email) = lower('YOUR_LOGIN_EMAIL@example.com')
),
grant_test as (
  insert into public.kahwin_subscriptions
    (couple_id, plan, period_end, updated_at)
  select couple_id, 'monthly', now() + interval '7 days', now()
  from owner_couple
  on conflict (couple_id) do update
     set plan = 'monthly',
         period_end = excluded.period_end,
         updated_at = now()
     where public.kahwin_subscriptions.period_end <= now()
  returning couple_id, plan, period_end
)
select couple_id, plan, period_end
from grant_test;

-- If the result contains zero rows, verify the owner's email; alternatively,
-- an active subscription already exists and has deliberately been left unchanged.
