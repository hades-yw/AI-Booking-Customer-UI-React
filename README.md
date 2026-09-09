# BookLocal — Customer Booking App

React and TypeScript customer application for browsing merchants and making guest or account-linked bookings. Customer authentication is provided by the existing Keycloak `booking` realm and its `booking-web` public client. Google, Facebook, email registration, email verification, password recovery, and passwords are handled by Keycloak.

## Requirements

- Node.js 22.12 or newer and npm
- Docker with Compose v2.20 or newer
- Python 3.11
- The sibling `AI-Booking-System` repository checked out beside this repository

The application stores Keycloak tokens only in memory. A page reload restores an existing Keycloak SSO session when the browser permits it. Public browsing and guest booking remain available when no session exists.

## Local Keycloak and backend

From the sibling `AI-Booking-System` repository, start the isolated development services:

```sh
docker compose -f docker-compose.auth-dev.yml up -d
docker compose -f docker-compose.auth-dev.yml ps
python3.11 -m venv .venv
.venv/bin/pip install -r requirements.txt
cp env.keycloak.example .env
.venv/bin/alembic upgrade head
```

Preserve an existing `.env` rather than overwriting it. Append `http://localhost:5173` to `CORS_ORIGINS` in the backend `.env`, then start FastAPI:

```sh
.venv/bin/uvicorn app.main:app --reload --port 8000
```

Keycloak runs at `http://localhost:8180`. Its development-only administration credentials are:

```text
Username: admin
Password: local-keycloak-admin
```

For a fresh environment, open the Keycloak administration console and import `AI-Booking-System/deploy/keycloak/booking-realm.local.json` once. Importing the realm is not an update process for an existing realm.

### Configure booking-web for React

In the `booking` realm, open **Clients > booking-web** and add these values without removing the existing Flutter URLs:

- Valid redirect URIs: `http://localhost:5173/auth/callback`
- Valid redirect URIs: `http://localhost:5173/silent-check-sso.html`
- Valid post logout redirect URIs: `http://localhost:5173/`
- Web origins: `http://localhost:5173`
- Home URL: retain the Flutter value when both applications coexist; React supplies its callback explicitly

Keep Standard flow enabled, PKCE set to S256, and Direct access grants and Implicit flow disabled. The client must retain the `booking-api` audience mapper and authentication-method (`amr`) mapper. Never add a client secret to this browser application.

These settings change the active Keycloak service and are not stored by this repository. This feature does not modify `AI-Booking-System` or its realm template.

### Google and Facebook

Identity provider credentials belong only in Keycloak. Under **Identity Providers**, configure provider aliases `google` and `facebook`, copy the broker callback shown by Keycloak into each provider console, request identity/profile/email, disable provider-token storage, and retain the existing first-broker-login and post-login flows.

An unverified or missing social-provider email must be verified in Keycloak before account features can be used. Regular customer accounts are not required to enrol MFA. Accounts that also hold management membership remain subject to the backend's signed `amr: ["otp"]` requirement.

## Run the React application

Copy the environment template and install dependencies:

```sh
cp .env.example .env
npm install
npm run dev
```

Local defaults:

```dotenv
VITE_API_BASE_URL=http://localhost:8000/v1
VITE_KEYCLOAK_URL=http://localhost:8180
VITE_KEYCLOAK_REALM=booking
VITE_KEYCLOAK_CLIENT_ID=booking-web
```

Open `http://localhost:5173`. The callback route is `/auth/callback`; `/silent-check-sso.html` is a static iframe callback and must remain available in deployed builds.

## Authentication and guest behavior

- **Sign in with email** opens the branded Keycloak login page, which also provides password recovery.
- **Create an account** opens Keycloak registration and email verification.
- **Continue with Google/Facebook** selects the matching Keycloak identity provider.
- **Continue as guest** returns to the pending public booking flow without creating an account.
- Profile, favourites, and booking history require an authenticated customer account.
- An in-progress booking is saved in per-tab session storage for up to 30 minutes while authentication redirects. Pricing is discarded on restore and requested again from the backend.
- Guest bookings omit the bearer token. Signed-in bookings use a refreshed Keycloak access token and are linked to the customer's profile by the backend.

## Test checklist

Run automated checks:

```sh
npm test
npm run lint
npm run build
```

For local integration testing, verify:

1. Register with email, complete verification, and return to the original page.
2. Sign in using email, Google, and Facebook; cancel each flow once and continue as guest.
3. Begin a booking, sign in, and confirm that the draft returns with a newly fetched quote.
4. Complete a guest booking and confirm no Authorization header is sent.
5. Complete a signed-in booking and confirm it appears in booking history.
6. Save and remove a favourite, edit the profile, open Keycloak account management, and log out.
7. Let a token expire and confirm the next protected request refreshes it or clears the session cleanly.
8. Confirm a normal customer is not asked for OTP. Confirm a management account without `amr: otp` receives the backend MFA rejection.
9. Stop Keycloak and confirm public browsing and guest booking remain available.

## Troubleshooting

- **Invalid redirect URI:** add both React callback URLs exactly as shown above to `booking-web`.
- **CORS error:** include `http://localhost:5173` in the backend `CORS_ORIGINS` and in the client's Keycloak Web origins.
- **401 invalid issuer:** the frontend and backend must use the same public issuer, `http://localhost:8180/realms/booking` locally.
- **401 invalid audience/client:** retain the `booking-api` audience mapper and ensure the backend accepts `booking-web`.
- **Verify your email:** finish the Keycloak email action; account provisioning requires a verified email.
- **Social login has no email:** configure the provider to supply email or complete Keycloak's email verification step.
- **403 requiring two-factor authentication:** the identity has management access. Complete OTP enrolment and sign in again so the token contains `amr: ["otp"]`.
- **Keycloak unavailable:** confirm the Compose service is healthy at `http://localhost:8180`; guest use should still work.

## Project structure

Application data access is defined by `src/api/client.ts` and implemented by `src/api/httpClient.ts`. Keycloak lifecycle code lives in `src/auth`, React authentication state in `src/context/AuthContext.tsx`, and the booking draft in `src/context/BookingFlowContext.tsx`. The real backend client is selected in `src/api/index.ts`.

Production deployments must add their exact HTTPS React callback, silent SSO, logout, and origin URLs to the active `booking-web` client. Do not use wildcard production origins and do not place identity-provider credentials in Vite environment variables.
