# EasyABC — Activate one-hour ToyyibPay expiry (server-side)

**Code preparation completed; still requires a Supabase administrator to deploy.**
Do not put ToyyibPay secret keys into GitHub or client-side `index.html`.

## 1. Apply database migration

Run [supabase/bill_expiry_1h_setup.sql](./bill_expiry_1h_setup.sql) in the Supabase SQL Editor.
This adds `orders.expires_at`, keeps all existing orders, and audits future status changes.
It does **not** cancel or delete any ToyyibPay bill by itself.

## 2. Modify the deployed Supabase Edge Function `create-payment`

Open Supabase Dashboard → Edge Functions → `create-payment` → Code. Use
the **existing working** code and add the expiry setting to the
`FormData` that is sent to `https://toyyibpay.com/index.php/api/createBill`.

Calculate once, immediately before creating the order/payment:
```ts
const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
const fmt = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Asia/Kuala_Lumpur",
  year: "numeric", month: "2-digit", day: "2-digit",
  hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false,
  hourCycle: "h23"
});
const pieces = Object.fromEntries(
  fmt.formatToParts(expiresAt)
    .filter(x => x.type !== "literal")
    .map(x => [x.type, x.value])
);
const billExpiryDate =
  `${pieces.day}-${pieces.month}-${pieces.year} ${pieces.hour}:${pieces.minute}:${pieces.second}`;
```

Set ToyyibPay's exact-date field **before** the HTTP request:
```ts
form.set("billExpiryDate", billExpiryDate);
form.delete("billExpiryDays"); // This field is in whole days, not hours.
```

In the existing Supabase `orders` INSERT, include:
```ts
expires_at: expiresAt.toISOString(),
```
In the success response sent to the browser, add:
```ts
expires_at: expiresAt.toISOString(),
```
Keep the existing total-price calculation, callback URL, secure secret key, customer info,
order-item insertion and download security unchanged.

**IMPORTANT:** Date-time field `billExpiryDate` accepts
`DD-MM-YYYY HH:mm:ss` while `billExpiryDays` is limited to 1–100 days.
ToyyibPay prioritises `billExpiryDate` when both are present.
[Official API reference](https://toyyibpay.com/apireference/).

## 3. Keep late payment confirmations

- Never decide payment is permanently failed solely because local time passed `expires_at`.
- Use the existing authenticated ToyyibPay callback to validate the callback hash,
  bill code, order ID and full paid amount **before** changing any order to paid.
- A legitimate success callback must be allowed to change an old `pending`,
  `failed` or `cancelled` order to `paid` after its deadline. If existing code
  updates only when `status = 'pending'`, adjust it carefully after verifying
  provider data; otherwise it may discard a late confirmed payment.
- Never downgrade an already-paid order to failed or cancelled because a late
  notification arrived. The migration includes a database safeguard for this.
- Retain order and order-item records for reconciliation. Expired-but-pending
  entries are shown as **EXPIRED · VERIFY PAYMENT** in the admin History view.
- If implementing an automated final-expiry worker, query
  `getBillTransactions` for successful/pending transactions before changing
  internal status; the provider's `inactiveBill` API can refuse to inactivate
  a bill with a pending transaction.
- The customer-facing one-hour countdown is a **UI safeguard only**, not a
  substitute for the provider expiry and validated callback.

## 4. Existing bills

Bills generated **before** this change may still be active at ToyyibPay.
Adding `billExpiryDate` to future API requests does NOT retroactively
expire them. Reconcile or inactivate them using authenticated ToyyibPay
administration; check whether a bank transaction is already pending first.

## 5. Test before accepting new real payments

In ToyyibPay's sandbox, test: unpaid after one hour, pending bank transfer at
one hour, success before expiry, late success callback, repeated failure callback
after success, admin history retention, and My Purchases/download access.
Make sure expired bills cannot accept a **new** payment on ToyyibPay.
