# Lovelet ♡

A little link, a lot of love. A ₹199 personalized digital surprise, built with Next.js, React, TypeScript, PostgreSQL and Razorpay. Start with thoughtful apology pages; the same engine also supports birthdays, anniversaries, friendship and thank-you surprises.

## Run locally

Requires **Node.js 24** and npm. Each cloud task already has an isolated checkout; use it directly, without creating a worktree.

```sh
cd /workspace/Lovelet # or your checkout directory
npm ci
cp .env.example .env.local
npm run dev
```

Open `http://localhost:3000` locally. `.env.example` enables clearly labelled demo payments **only in development**. Demo mode is always disabled when `NODE_ENV=production`. No Razorpay account, database server, email or S3 credentials are needed for a local demo: SQLite and photos are stored in ignored `.data/`. A demo management link is shown on the success screen; email recovery requires real email configuration.

## What is implemented

- Responsive landing page with three CSS-animated theme illustrations, pricing, demos, FAQ and policies.
- No-account, three-step builder: names, occasion, personal message, writing prompts, final note, up to five photographs, music, preview and optional password.
- Client-side JPEG compression and metadata stripping; server-side upload limits and ownership checks. Photos are never stored in public static directories.
- One reusable recipient engine: envelope, tap-to-start music, message, individually navigable photos and final note. Original synthesized melodies use Web Audio; no externally licensed songs are bundled. Pause/mute, fallback play and reduced-motion support are included.
- Fixed **19,900 paise INR** Razorpay orders, server HMAC verification, captured-payment lookup, amount/currency/order checks, idempotent publication and verified webhooks. Concurrent callbacks return one link.
- Unpredictable 192-bit share links, `noindex` metadata, optional scrypt-hashed passwords, HttpOnly access cookies, private management tokens and ownership checks.
- Editing for 24 hours after payment, access for 90 days, immediate owner/admin removal and scheduled deletion of expired photographs/content.
- Management link email with delivery retries and email recovery. Purchase status reconciles captured payments even when the browser closes before returning.
- Token-protected admin dashboard: latest orders, payment recovery, removal, refund requests, cleanup and anonymous aggregate funnel counters.

## Production configuration

Set these **server-side**, never in a committed file or `NEXT_PUBLIC_` variable:

| Variable                                             | Purpose                                                                        |
| ---------------------------------------------------- | ------------------------------------------------------------------------------ |
| `APP_URL`                                            | Canonical HTTPS origin; must match the customer-facing domain                  |
| `APP_SECRET`                                         | Random 32+ byte secret for protected-page access cookies                       |
| `DATABASE_URL`                                       | PostgreSQL connection URL, with provider-supported TLS verification            |
| `S3_BUCKET`, `AWS_REGION`                            | Private photo bucket and region                                                |
| `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`         | Least-privilege object storage credentials; workload IAM credentials also work |
| `S3_ENDPOINT`                                        | Optional S3-compatible provider endpoint                                       |
| `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`             | Test credentials first; live after activation/KYC                              |
| `RAZORPAY_WEBHOOK_SECRET`                            | Separate random webhook signing secret                                         |
| `RESEND_API_KEY`, `MAIL_FROM`                        | Resend key and verified sending-domain email address                           |
| `ADMIN_TOKEN`                                        | Strong random administrator login token                                        |
| `CRON_SECRET`                                        | Strong random cleanup endpoint authorization token                             |
| `BUSINESS_NAME`, `BUSINESS_ADDRESS`, `SUPPORT_EMAIL` | Actual legal operator and support contact shown in policies                    |

Production requires PostgreSQL and object storage by default. `ALLOW_LOCAL_STORAGE=true` is an explicit escape hatch for a **single persistent server only**; SQLite and local photos are unsuitable for ephemeral/serverless or multi-instance deployment. Never enable it on Vercel/serverless. No credentials are included in this project. Email delivery uses Resend's HTTPS API; customer email addresses are used only for delivery and recovery.

```sh
npm ci
npm run build
npm start
```

Place behind HTTPS. Restrict database/bucket access to the server. Use a private bucket, and configure lifecycle/backup policies consistent with the retention promises. Dynamic APIs use the Node.js runtime, not Edge. Schema initialization runs automatically; this initial release has no database migrations yet.

### Razorpay

1. Complete activation/KYC and publish accurate business details, terms, privacy, refunds/cancellations and digital-delivery policies. The policies page is starter text: the operator must review it and applicable tax treatment before launch.
2. Start with test keys. Configure `https://your-domain/api/webhooks/razorpay`, the webhook signing secret, and `payment.captured`, `order.paid`, `refund.processed` events. Enable automatic capture in Razorpay. An authorized but uncaptured payment **never publishes** a page.
3. Test success, failure, duplicate events and closing checkout before the return handler. Keep test and live credentials/secrets aligned. Confirm capture settings, real webhook delivery and refunds in your own Razorpay account before accepting customers.
4. Switch to live keys only after operational testing. Checkout refuses to proceed without email and business configuration; production also requires canonical HTTPS origin and security/recovery secrets.

Order creation uses an atomic reservation to prevent parallel creation. If the API times out, the order remains `ordering`; subsequent requests and reconciliation look up its receipt before allowing another order. If Razorpay confirms **no order exists**, the operator must investigate the failed request and safely reset the reservation through controlled database maintenance. The application deliberately does not create another order on an uncertain response. Admin refund timeouts also remain pending; check Razorpay before any manual retry. Refund webhooks disable refunded surprises; cleanup deletes their images.

### Email, payment recovery and expiration

Schedule an authenticated `POST /api/cleanup` **at least every 5 minutes** with `Authorization: Bearer <CRON_SECRET>`. Alternatively run `npm run cleanup` on the server with the same environment. A nonzero `failed` count means the job needs investigation/retry. This job:

- reconciles recent pending orders and captured payments;
- retries unsent purchase emails (with a stable Resend idempotency key);
- purges unpaid drafts after 7 days and paid content after 90 days;
- purges removed/refunded pages, and clears expired rate-limit counters.

Expired/removed pages deny access immediately, even before cleanup runs. Keep cleanup monitoring and backups aligned with the disclosed deletion policy. Short-lived mail jobs temporarily hold a management token to permit email retries; it is erased after successful send. Restrict access to the database and backups. Recovery replaces previous management tokens. An email outage does not invalidate the old management link.

### Music

The five melodies are original procedural sequences synthesized by the source code in `components/surprise.tsx` from the notes in `lib/content.ts`. They are distributed under this project's MIT license for commercial hosted use. No recordings or recognizable copyrighted songs are included. If you replace them with recordings, obtain licenses explicitly covering commercial use on customer pages; social-media music permissions are not enough. The demo uses fictional names and abstract illustrations, without stock customer photos.

### Security and operating limits

- Use strong, different admin/app/cron/webhook secrets; rotate them if disclosed. Management tokens in links are bearer credentials: keep them private. They are put in URL fragments and removed from the address bar after opening.
- `APP_URL` must match the browser origin for CSRF checks. Do not disable origin checks to work around deployment errors. Never log authorization headers, management-link fragments, or submitted messages.
- Basic database-backed rate limits are included. Add edge/proxy IP rate limits and request-size limits (2.2 MB for uploads, ~32 KB for JSON) before public launch. The app's global limits are intentionally conservative; review them against real traffic. Configure trusted proxy settings rather than blindly trusting user-supplied IP headers.
- Frontend compression is limited to 10 MB inputs, 1600px longest edge and 2 MB JPEG output. Server validates JPEG magic/type/size; deploy ingress body-size limits and consider image decoding/scanning for adversarial public uploads.
- Aggregate metrics count page mounts, not unique people. Admin lists the latest 100 purchases. This MVP has one operator token, no multi-user admin roles or audit log, and no scheduled-reveal or voice-note premium tier.
- The policies are editable starter content, not a claim of legal/tax review. Actual iPhone, Android and Instagram in-app browser validation is required before launch; automated Chromium testing does not establish those platforms work.

## Validation

```sh
npm test                # validation, payment integrity, concurrent publication, recovery, cleanup
npm run typecheck
npm run build
npx playwright install chromium
npm run test:e2e        # mobile-sized builder-to-recipient flow, password, upload, edit, removal, admin
npm audit
```

For a preinstalled Chromium: `CHROMIUM_EXECUTABLE=/usr/bin/chromium npm run test:e2e`. Tests use development-only demo payments, not real funds. Core payment tests use an explicitly mocked Razorpay response; they prove server checks and recovery logic, not account activation or provider connectivity. E2E tests require an otherwise idle local port 3000 and use isolated `.data/e2e/` and `.data/core-tests/` databases, overriding external database, storage and email configuration. Never point test commands at production databases or keys.

## Launch checklist

- Configure production secrets, PostgreSQL, private storage and verified email domain.
- Review policies and publish real operator/contact details; verify pricing and tax requirements.
- Finish Razorpay KYC and test live provider/webhook/refund configuration.
- Schedule and monitor cleanup; test failed delivery and email recovery with your provider.
- Test on real iPhone, Android and Instagram browsers; verify audio, uploads and checkout.
- Add operational monitoring, backups and ingress abuse controls.
- Get consent for any customer examples. Aim for ten reliable paid deliveries before expanding.
