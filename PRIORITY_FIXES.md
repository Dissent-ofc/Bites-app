# PRIORITY FIXES

This file lists prioritized issues and quick actions to improve stability, correctness, and security.

## Implemented

1. Fix `FoodItem.price` type mismatch (High)
   - Problem: `server/models/FoodItem.js` defines `price` as `String` but the app treats it as a number in several places.
   - Action: Change `price` field type to `Number`, update any seed/data files to use numeric prices, and run a migration or re-seed.

2. Harden cart endpoints and validation (High)
   - Problem: Cart routes accept JSON but rely on implicit types; frontend sends numbers but some fields may be strings.
   - Action: Add centralized request validation middleware (e.g., `express-validator`), ensure `qty` and `price` are numeric, return clear error messages.

3. Add auth protection where appropriate (Medium)
   - Problem: Sensitive endpoints (orders, user-specific actions) are not consistently protected.
   - Action: Add JWT middleware and require authentication for `orders` and optionally associate carts with users.

4. Improve error logging and responses (Medium)
   - Problem: Server often returns generic 500 messages without logging details.
   - Action: Add structured logging (console or pino), include error details in server logs, and return helpful client-facing messages.

5. Consistency: `id` mapping in frontend (Low)
   - Problem: Frontend normalizes `_id` to `id` but some server responses may be inconsistent.
   - Action: Ensure all API responses return Mongo objects consistently; consider a small response formatter.

6. Documentation and README (done)
   - Action: Keep README updated with env vars, run steps, and common troubleshooting (this was added).

## Remaining

1. Add automated API tests (Medium)
   - Status: Implemented with Node test runner + Supertest + mongodb-memory-server in `server/tests/cart.api.test.js`.

## Repro steps for "can't add to cart"
- Verify backend is reachable at `http://localhost:5000`. If frontend shows network error, ensure server is running and `vite.config.js` proxy is active.
- Try the curl test in README. If it returns 500, check server logs for errors and verify `MONGODB_URI` connectivity.
