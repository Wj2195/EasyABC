# EasyABC setup

## Step 1 — GitHub
Completed. The website and Pages workflow are in this repository.

## Step 2 — Supabase
1. Create a free Supabase project.
2. Open SQL Editor.
3. Copy and run `supabase/schema.sql`.
4. Enable Anonymous Sign-Ins in Authentication settings.
5. Copy the Project URL and Publishable/Anon key.

After that, the frontend can be switched from built-in demo products to live Supabase products.

## Step 3 — Payment
After Supabase works, connect a Malaysian payment provider such as toyyibPay for fixed-amount checkout and DuitNow QR.
Keep secret keys server-side only.
