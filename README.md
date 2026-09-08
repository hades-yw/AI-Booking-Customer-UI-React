# BookLocal — Customer Booking App

A multi-route React + TypeScript app for browsing local service merchants and
booking appointments: landing/search → merchant detail → date & time →
customer details → checkout → confirmation. Built with Vite, React Router,
and Tailwind CSS v4. Responsive from mobile up through desktop.

## Getting started

```bash
npm install
npm run dev       # http://localhost:5173
npm run build      # production build to dist/
npm run preview    # preview the production build
```

## Project structure

```
src/
  api/            # Typed API contract + mock/http implementations (see below)
  types/          # Shared domain types (Merchant, ServicePackage, Booking…)
  lib/            # Formatting/date helpers, useAsync data-fetching hook
  context/        # BookingFlowContext (in-progress booking) and FavoritesContext
  components/
    ui/           # Generic primitives: Button, Card, TextField, StepProgress…
    layout/       # Page shell pieces: TopNav, BottomActionBar, PageContainer
  features/
    merchants/    # Merchant card/grid/category filter
    booking/      # Date strip, time slot grid, package card, payment picker
  pages/          # One component per route
  routes.tsx      # Route table
  App.tsx         # Providers + router outlet
```

## Connecting a real API

All data access goes through `src/api/index.ts`, which exports a single
`api` object typed by the `ApiClient` interface in `src/api/client.ts`.
Right now it points at `mockApiClient` (`src/api/mockClient.ts`), which
serves the mock data in `src/api/mockData.ts` with a simulated network
delay — nothing else in the app talks to that mock data directly.

To go live:

1. Copy `.env.example` to `.env` and set `VITE_API_BASE_URL`.
2. Implement your endpoints against the reference client in
   `src/api/httpClient.ts` (already scaffolded with `fetch`, matching the
   `ApiClient` contract — adjust paths/payloads to your backend).
3. In `src/api/index.ts`, change the export to `httpApiClient`.

No page or component needs to change — they all depend on the `ApiClient`
interface, not on how it's implemented.

## Notes

- The in-progress booking (selected package, schedule, customer details,
  payment method) lives in `BookingFlowContext` for the duration of the
  booking flow. Directly linking to or refreshing `/checkout` without
  completing the earlier steps redirects to the landing page, since there's
  no server-side session to restore it from.
- Favourited merchants live in `FavoritesContext` (in-memory, per session).
