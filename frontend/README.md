# Soan Papdi Club — React Frontend

A mobile-first React + Vite frontend styled with Tailwind CSS. It connects to the existing Soan Papdi Club Express API; no backend rewrite is required.

## Main experience

- Claim links open a friendly gift preview at `/claim/:token`. Previewing the link is read-only.
- Recipients sign in with Google, then explicitly choose whether to share their location before claiming.
- Location permission is optional. Denying permission or choosing “Skip location” still allows the claim.
- After a successful claim, the recipient lands on the journey-first dashboard.
- The dashboard leads with the live shared-location map and a prominent “Pass the gift on” action.
- The Explore drawer contains collection, received gifts, sent gifts, box tracking, and add-box tools.

## Stack

- React 18, React Router, Vite
- Tailwind CSS
- React Leaflet + Leaflet
- Lucide React icons
- Existing Node.js / Express / Prisma / Neon backend

## Local setup

Requirements: Node.js 20+ and the existing backend running on port 4000.

1. Open a terminal in `frontend`.
2. Create `.env` from `.env.example` and set:

   ```env
   VITE_API_BASE_URL=http://localhost:4000
   VITE_GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
   ```

3. Ensure `backend/.env` contains:

   ```env
   FRONTEND_URL=http://localhost:5173
   ```

4. In Google Cloud Console, add `http://localhost:5173` under the OAuth client's **Authorized JavaScript origins**.
5. Start the backend in its own terminal:

   ```bash
   cd backend
   npm run dev
   ```

6. In another terminal, install and start the frontend:

   ```bash
   cd frontend
   npm install
   npm run dev
   ```

7. Open `http://localhost:5173`.

The first `npm install` refreshes `package-lock.json` to match the new React dependencies.

## Build

```bash
npm run build
npm run preview
```

## Existing API routes used

- `GET /api/auth/me`
- `POST /api/auth/google`
- `POST /api/auth/logout`
- `GET /api/dashboard`
- `GET /api/boxes`
- `POST /api/boxes`
- `GET /api/boxes/:boxCode/journey`
- `POST /api/transfers`
- `GET /api/transfers/sent`
- `GET /api/transfers/received`
- `GET /api/transfers/claim/:token`
- `POST /api/transfers/claim`
- `GET /api/map/locations`

## Map and location privacy

The map endpoint requires an authenticated session. It returns approximate coordinates (rounded by the backend) for people who voluntarily shared location when claiming. Each location is shown as an approximate 5 km circle. Exact coordinates are not displayed by the map UI. The frontend does not request location when a claim link is opened; it requests it only after the recipient explicitly chooses “Share location & claim”.

## Add-box note

The existing `POST /api/boxes` endpoint creates a box record and assigns its unique code. This is a collection/testing action, not a payment or purchase flow. The image URL must be a direct HTTP(S) URL; the UI uses the bundled `/soanpapdi.jpg` asset by default.

## Deployment

For production, set `VITE_API_BASE_URL` to the deployed backend URL and update backend `FRONTEND_URL` and CORS to the deployed frontend origin. Use HTTPS and configure secure cookies appropriately. Keep `.env`, database passwords, OAuth secrets, and session cookies out of Git.
