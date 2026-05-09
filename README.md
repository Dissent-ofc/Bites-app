# Bites App

A simple food-ordering demo app (React + Vite frontend, Node/Express backend, MongoDB).

## Quickstart (local)

Requirements:
- Node.js (>=16)
- npm
- MongoDB (local or Atlas)

1. Install dependencies

```bash
npm install
```

2. Create environment variables (example `.env` in `server/`):

- `MONGODB_URI` — MongoDB connection string (required)
- `PORT` — optional server port (default 5000)
- `SEED_ON_START` — set to `false` to skip seeding on start (default: seeds run)

3. Run server and dev frontend (from repo root)

```bash
# start backend only
npm run server

# start frontend dev server only
npm run dev

# or run both concurrently
npm run dev:all
```

4. Access app

Open http://localhost:5173 (Vite) — frontend proxies `/api` to `http://localhost:5000`.

## Troubleshooting — adding items to cart

- Ensure the API server is running (default port 5000) and `MONGODB_URI` is set.
- From the frontend the cart POST endpoint is `/api/cart/add` — quick curl test:

```bash
curl -X POST http://localhost:5000/api/cart/add -H "Content-Type: application/json" \
  -d '{"name":"Test Item","qty":1,"price":50}'
```

- If the curl returns an error, check server logs for stack traces and check MongoDB connection.

## Project Structure

- `server/` — Express API, routes, models, seed data
- `src/` — React app (components, pages, context, services)

## Next steps / recommended fixes
- See PRIORITY_FIXES.md for prioritized fixes and notes.
