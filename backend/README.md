# Soan Papdi Club — Backend API

A starter production-minded API for the Soan Papdi Club frontend. Built with Node.js, Express, PostgreSQL, Prisma, Google Sign-In verification, and signed HTTP-only session cookies.

## Included

- Google Identity Services credential verification on the server (no trusting client-supplied email/name).
- User profiles and secure HTTP-only session cookies.
- Add a box using a direct image URL; unique `SP-00000`-style code and initial journey event are created together.
- List currently owned boxes and dashboard counts.
- Create a shareable pass-on claim invitation. The box stays with the sender until somebody explicitly claims it.
- Preview a claim link without transferring ownership; link scanners and previews do not claim boxes.
- Transactional, single-winner claim logic: the transfer status and box owner are conditionally updated and the permanent journey event is written in the same transaction.
- Public box journey by box code.
- Received-by-me history (including boxes passed onward) and sent-by-me transfer history.
- Input validation, basic security headers, CORS allow-list, and rate limits.

## Requirements

- Node.js 20+
- PostgreSQL database (Neon works well)
- Google OAuth client ID configured for Google Identity Services

## Local setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Copy `.env.example` to `.env` and fill in the values:

   ```bash
   cp .env.example .env
   ```

   On Windows PowerShell, use `Copy-Item .env.example .env`.

3. In Neon, create a PostgreSQL project/database and copy its connection string into `DATABASE_URL`. Keep the password private. Use the pooled or direct connection string as appropriate for your deployment; Neon connection strings should normally include `sslmode=require`.

4. In Google Cloud Console, configure an OAuth client ID for the web app. Add your frontend origin (for local development, `http://localhost:5173`) to **Authorized JavaScript origins**. Put the client ID in both this backend's `GOOGLE_CLIENT_ID` and the frontend Google Identity Services configuration. The frontend should send the Google `credential` string to `POST /api/auth/google`.

5. Generate a strong session secret. For example, in a shell with OpenSSL:

   ```bash
   openssl rand -base64 48
   ```

   Paste it into `JWT_SECRET` (at least 32 characters).

6. Generate Prisma Client and create the database schema:

   ```bash
   npm run db:generate
   npm run db:migrate -- --name init
   ```

7. Start the server:

   ```bash
   npm run dev
   ```

   Health check: `http://localhost:4000/health`.

## Production notes

- Set `NODE_ENV=production`, `COOKIE_SECURE=true`, a long random `JWT_SECRET`, production `FRONTEND_URL`, and production `BACKEND_URL`.
- Serve both frontend and backend over HTTPS. If frontend and API are on different sites, set `COOKIE_SAME_SITE=none` and `COOKIE_SECURE=true`; test browser third-party-cookie restrictions. A same-site deployment or reverse proxy is generally more reliable.
- Never commit `.env`, database credentials, Google secrets, or claim tokens.
- Back up the database and configure monitoring before a public launch.
- Claim links are bearer secrets. Anyone holding the link can attempt to claim it, so share them only with the intended recipient. They expire after 7 days by default; configure `CLAIM_LINK_TTL_HOURS` to change this.
- No sender cancellation endpoint is provided, matching the product rule that a pending pass cannot be cancelled by the sender.
- The backend validates the image URL's protocol, but it does not fetch the URL. For production, consider allowing only trusted image hosts or using managed object storage to avoid broken/external images.
- The claim transaction uses serializable isolation and conditional updates. Under a race, one claim succeeds; competing claims receive a conflict response. PostgreSQL/Prisma may surface a serialization conflict, which is handled as HTTP 409.

## API overview

All API routes are prefixed with `/api`. Authenticated routes use the `spc_session` HTTP-only cookie. For local frontend requests, use `credentials: 'include'` in `fetch`.

| Method | Endpoint | Auth | Purpose |
|---|---|---:|---|
| GET | `/health` | No | Liveness check |
| POST | `/api/auth/google` | No | Verify Google credential and sign in |
| GET | `/api/auth/me` | Yes | Current user |
| POST | `/api/auth/logout` | No | Clear session cookie |
| GET | `/api/dashboard` | Yes | Stats and recent journey activity |
| GET | `/api/boxes` | Yes | Boxes currently owned by the user |
| POST | `/api/boxes` | Yes | Add/buy a box (demo checkout can call this) |
| GET | `/api/boxes/:boxCode/journey` | No | Public permanent journey |
| POST | `/api/transfers` | Yes | Create pass invitation and WhatsApp URL |
| GET | `/api/transfers/claim/:token` | Yes | Read-only claim preview |
| POST | `/api/transfers/claim` | Yes | Explicitly claim a box with `{ "token": "..." }` |
| GET | `/api/transfers/sent` | Yes | Sent invitations and outcomes |
| GET | `/api/transfers/received` | Yes | Received journey events, even if passed onward |

### Example requests

Sign in after Google Identity Services returns a credential:

```js
const response = await fetch('http://localhost:4000/api/auth/google', {
  method: 'POST',
  credentials: 'include',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ credential: googleCredential }),
});
const result = await response.json();
```

Add a box:

```js
await fetch('http://localhost:4000/api/boxes', {
  method: 'POST', credentials: 'include',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ imageUrl: 'https://example.com/soan-papdi.jpg' }),
});
```

Pass on a box:

```js
const response = await fetch('http://localhost:4000/api/transfers', {
  method: 'POST', credentials: 'include',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ boxCode: 'SP-00007', message: 'Happy Diwali!' }),
});
const { claimUrl, whatsappUrl } = await response.json();
// Navigate to whatsappUrl after a user click.
```

Claiming is a two-step flow: first `GET /api/transfers/claim/:token` to display the box preview, then after the signed-in user clicks **Claim Box**, call:

```js
await fetch('http://localhost:4000/api/transfers/claim', {
  method: 'POST', credentials: 'include',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ token }),
});
```

## Data model

- `User`: verified Google identity and profile.
- `Box`: stable box code/image and current owner.
- `Transfer`: invitation, hashed one-time token, sender, claimant, expiry and state.
- `BoxJourney`: append-only ownership story events. A box returning to a previous owner naturally appears as another event; no journey is overwritten.

The initial purchase route currently creates a box directly. If real payments are added later, do **not** create paid inventory solely from a browser request; create it only after a trusted payment-provider webhook verifies payment.

## Frontend integration checklist

- Replace hardcoded demo arrays with calls to `/api/dashboard`, `/api/boxes`, `/api/transfers/received`, and `/api/transfers/sent`.
- Configure Google Identity Services with the same client ID and POST its credential to `/api/auth/google`.
- Use `credentials: 'include'` for all authenticated API calls.
- Point `FRONTEND_URL` to the frontend origin so generated claim links use the correct domain.
- Make `/claim/:token` a frontend route that loads the read-only preview and displays a separate, explicit Claim Box button.
- Use `/api/boxes/:boxCode/journey` for public journey views.

This is a runnable backend starter, but it has not been deployed or connected to your Neon/Google projects. Configure secrets and run the migrations before use.
