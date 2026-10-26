# Soan Papdi Club — Frontend

A lightweight Vite + vanilla JavaScript frontend connected to the Soan Papdi Club Express API. No React required.

## Features

- Google sign-in using Google Identity Services and the backend `POST /api/auth/google` route.
- Session-cookie authentication (`credentials: include`).
- Live dashboard statistics, current inventory, received history, sent transfers, and recent journey events.
- Add a box using a direct image URL (`POST /api/boxes`). The server assigns the unique box ID.
- Create a secure pass-on link and open the WhatsApp share URL (`POST /api/transfers`). Ownership does not change until a recipient claims the link.
- Claim page at `/claim/:token`: preview is read-only; transfer only happens after an explicit Claim button (`POST /api/transfers/claim`).
- Public journey tracking by box code.

## Requirements

- Node.js 20+
- The Soan Papdi Club backend running and connected to Neon/PostgreSQL
- Google OAuth Web Client ID matching the backend's `GOOGLE_CLIENT_ID`

## Setup

1. Extract this folder alongside the backend project (or wherever you prefer).
2. In this folder, create `.env` from `.env.example`.
3. Set the same Google OAuth Web Client ID used by the backend:

   ```env
   VITE_API_BASE_URL=http://localhost:4000
   VITE_GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
   ```

4. In the backend `.env`, confirm:

   ```env
   FRONTEND_URL=http://localhost:5173
   ```

5. In Google Cloud Console → OAuth client → Authorized JavaScript origins, add:

   ```text
   http://localhost:5173
   ```

   Keep the backend callback configuration as required by your backend. This frontend uses Google Identity Services ID-token flow, which posts the credential to `/api/auth/google`; it does not use a redirect callback URI for this frontend flow.

6. Start the backend in its own terminal:

   ```bash
   npm run dev
   ```

7. In this frontend folder, run:

   ```bash
   npm install
   npm run dev
   ```

8. Open the Vite URL, normally `http://localhost:5173`.

## API routes used

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

## Notes

- Payments are not integrated. “Add a box” currently creates a box record for testing; it is not a real purchase.
- The image URL must be a direct HTTP(S) URL. The default image is bundled locally for the UI, but the API currently requires an image URL when creating a box.
- For deployment, set `VITE_API_BASE_URL` to your deployed backend URL and update backend `FRONTEND_URL` and CORS to the deployed frontend origin. Use HTTPS in production and configure secure cookies appropriately.
- Do not commit `.env` or share database passwords, OAuth secrets, or session cookies.
