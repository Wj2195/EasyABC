# EasyABC – ToyyibPay payer prefill patch

Apply these changes to the live Supabase Edge Function **create-payment**.

ToyyibPay's Create Bill API supports payer prefill through:
- billPayorInfo = 1
- billTo
- billEmail
- billPhone

## Replace

```ts
form.set(
  "billPayorInfo",
  "0",
);
```

with:

```ts
form.set(
  "billPayorInfo",
  "1",
);
```

## Replace

```ts
form.set(
  "billEmail",
  "",
);
```

with:

```ts
form.set(
  "billEmail",
  String(body.customer_email || "")
    .trim()
    .toLowerCase()
    .slice(0, 150),
);
```

Keep these existing fields:

```ts
form.set(
  "billTo",
  cleanText(
    body.customer_name,
    100,
  ),
);

form.set(
  "billPhone",
  String(
    body.customer_phone || "",
  )
    .replace(/[^0-9+]/g, "")
    .slice(0, 20),
);
```

Recommended validation before creating the ToyyibPay bill:

```ts
const payerName = String(body.customer_name || "").trim();
const payerEmail = String(body.customer_email || "").trim().toLowerCase();
const payerPhone = String(body.customer_phone || "")
  .replace(/[^0-9+]/g, "")
  .slice(0, 20);

if (!payerName) {
  return new Response(
    JSON.stringify({ error: "Please enter your name." }),
    { status: 400, headers: corsHeaders },
  );
}

if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payerEmail)) {
  return new Response(
    JSON.stringify({ error: "Please enter a valid email." }),
    { status: 400, headers: corsHeaders },
  );
}

if (!payerPhone) {
  return new Response(
    JSON.stringify({ error: "Please enter your phone number." }),
    { status: 400, headers: corsHeaders },
  );
}
```

Then use `payerName`, `payerEmail`, and `payerPhone` for the ToyyibPay bill fields.

After editing the Edge Function, click **Deploy updates**.
