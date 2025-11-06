# Leave App — Full‑Stack (Vite + Ballerina) with Native Bridge Auth

A full‑stack Leave Management System. The user app is a React (Vite) front end designed to run inside a container mobile app that exposes a native bridge for authentication. The backend is implemented with Ballerina. An admin UI and a payslip viewer are included in this monorepo.

## Repository layout

```
.
├─ LICENSE
├─ package.json
├─ README.md  ← you are here
├─ srs.md
└─ leave-app/
	 ├─ backend/                 # Ballerina service (REST API + DB access
	 └─ leave-frontend/          # Leave mobile/web app (Vite + React + MUI)
```

This guide focuses on the Leave App under `payslip-viewer/leave-frontend` and its backend under `payslip-viewer/backend`.

## Features

- Leave request submission and listing per user
- Admin views: pending approvals and reports (when authorized)
- CSV/PDF exports in the Reports view
- Secure API calls using JWT retrieved from a native bridge (container app)
- Dev fallback when running in a browser without the bridge

## Tech stack

- Frontend: React (Vite, TypeScript), MUI
- Backend: Ballerina (Swan Lake), MySQL
- Auth: JWT obtained via a native bridge (window.nativebridge)

## Prerequisites

- Node.js 18+ and npm
- Ballerina 2201.x (Swan Lake)
- A MySQL database (connection configured in backend config)

## Quick start

### 1) Backend (Ballerina)

1. Open a terminal in `payslip-viewer/backend`.
2. Create `config.toml` (copy from any example if present) and set DB credentials and required configs.
3. Start the API:

   - `bal run`

The service will expose REST endpoints used by the frontends. Ensure your DB is reachable from the backend.

### 2) Leave App frontend (Vite)

1. Open a terminal in `payslip-viewer/leave-frontend`.
2. Install dependencies: `npm install`
3. Run dev server: `npm run dev`
4. Build for production: `npm run build`

Admin/payslip frontends live under `payslip-viewer/frontend` and `payslip-viewer/admin-frontend` and can be started similarly if needed.

## Native bridge integration (JWT)

The leave app does NOT hardcode tokens. It retrieves a JWT via the container app’s native bridge and attaches it to API requests as `x-jwt-assertion`.

- Bridge contract (window.nativebridge):

  - `requestMicroAppToken(): Promise<string | { token: string }>`
  - `requestUserId?(): Promise<string>` (optional)
- Frontend token utility: `payslip-viewer/leave-frontend/src/token.ts`

  - `getToken(): Promise<string>`
    - Tries `window.nativebridge.requestMicroAppToken()` first
    - Caches token in memory and saves to `localStorage`
    - Falls back to `localStorage.getItem('jwt')` in browser/dev
    - Throws if no token is available
  - `getEmailFromJWT(token: string): string | null`
- Where it’s used:

  - `src/App.tsx` → `/api/users/me` for role (admin) detection
  - `src/LeaveList.tsx` → `/api/leaves?user_id=<email>`
  - `src/LeaveRequestForm.tsx` → `POST /leaves`
  - `src/components/PendingLeaves.tsx` → admin endpoints under `/api/admin/leaves`
  - `src/components/Reports.tsx` → user or admin endpoints

All requests include the header `x-jwt-assertion: <token>`.

### Running without a bridge (browser/dev)

You can set a temporary token in `localStorage` to run the app in a regular browser:

```
// In the browser DevTools console
localStorage.setItem('jwt', '<your-jwt-here>')
```

Optionally, you can stub a simple bridge for end-to-end testing:

```
// In the browser DevTools console
window.nativebridge = {
	async requestMicroAppToken() { return localStorage.getItem('jwt') || ''; },
};
```

## API surface (high‑level)

The backend exposes endpoints consumed by the leave app. Typical patterns seen in the frontend code:

- `GET /api/users/me` → returns `{ status, data: { isAdmin } }`
- `GET /api/leaves?user_id=<email>` → returns the current user’s leaves
- `POST /leaves` with JSON `{ leave_id, user_id, leave_type, start_date, end_date, reason, status }`
- Admin endpoints (require admin role):
  - `GET /api/admin/leaves/pending`
  - `POST /api/admin/leaves/approve` with `{ leave_id }`
  - `POST /api/admin/leaves/reject` with `{ leave_id }`

All must be called with the `x-jwt-assertion` header.

## Configuration

- Backend config: `payslip-viewer/backend/config.toml` (create it if missing)
  - DB connection (host, port, user, password, database)
  - Any service ports and origins as needed
- Frontend config:
  - The leave app calls the backend with relative paths. If you host them on different origins, configure a dev proxy or enable CORS on the backend.

## Development workflows

- Type checking and build (leave app):
  - `npm run build`
  - `npm run dev` for hot reload
- Linting:
  - `npm run lint`

## Security notes

- Tokens must not be hardcoded in production. This repo is wired to use the native bridge via `getToken()`.
- The dev/browser fallback reads from `localStorage` only to enable local testing.
- Always transmit tokens over HTTPS and validate them on the backend.

## Troubleshooting

- “JWT token unavailable: native bridge not found and no local token set”

  - You’re likely running in a browser without a native bridge. Set a dev token in `localStorage` or run inside the container app.
- 401/403 responses from API

  - Ensure the `x-jwt-assertion` header is present.
  - Verify the token has not expired and has required scopes/claims.
- Admin views missing

  - Check `/api/users/me` response; the `isAdmin` flag controls admin UI availability.

## License

See [LICENSE](./LICENSE).
