# Kahwin v1 — deployment notes

**Price:** RM5/month or RM50/year per couple. Lifetime plan does not exist.

## Delivered
- Mobile responsive browser-based app at `/kahwin/` (a website app, not yet an Android APK).
- Email registration, login, create shared couple space, second partner joins using 12-character code.
- Two account limit, expiring invite codes, shared budget, expenses and tasks.
- Realtime updates and Supabase row-level security restricting reads to each couple; editing requires an active plan.
- SQL database migration: `kahwin/supabase/schema.sql`.
- Payment schema for monthly (500 sen) and annual (5000 sen) plans; subscriptions are server-controlled.

## To activate
1. Run `kahwin/supabase/schema.sql` in the EasyABC Supabase SQL Editor. If the tables already exist but you see `permission denied for table kahwin_members`, run just `kahwin/supabase/fix_permissions.sql` in the SQL Editor. The fix grants the minimum authenticated role privileges, while RLS still restricts data to the correct couple.
2. Register two distinct accounts at `https://wj2195.github.io/EasyABC/kahwin/`; confirm email if enabled.
3. On phone A create a couple space and generate a 48-hour invite. On phone B join using the code.
4. Payments remain **disabled** until a trusted backend creates ToyyibPay bills and independently confirms each transaction. The backend then calls the restricted `kahwin_apply_payment(payment_id, provider_reference)` RPC through the service role. Do not expose the service role key or ToyyibPay secret to browsers. Do not trust redirect parameters as payment confirmation.
5. For testing only, a Supabase administrator can grant a test subscription from SQL Editor:
   ```sql
   insert into public.kahwin_subscriptions(couple_id,plan,period_end)
   values ('COUPLE_UUID_HERE','monthly',now()+interval '1 month')
   on conflict(couple_id) do update set plan=excluded.plan,period_end=excluded.period_end;
   ```
6. To distribute a real downloadable Android APK: wrap the web app in Capacitor or implement the client in Flutter; configure auth redirects/deep links, Android signing, file hosting and app updates. **No APK has been compiled.**
7. Before customer launch, implement robust payment webhooks with independent verification, rate limits for invites, account/workspace deletion, privacy notice, backup/export, cancellation/renewal handling, and suitable commercial hosting. GitHub Pages should not be used as your paid SaaS production store.

Do not add a one-time download product for the subscription, since the existing EasyABC checkout processes downloadable products differently from renewable subscription access.
