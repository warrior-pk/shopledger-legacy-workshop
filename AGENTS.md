# Contributor guide

## Project overview

ShopLedger is an Express application for point-of-sale billing, inventory, customer credit (Khata), and reporting. The browser interface is served from `public/`; API data and operational records are stored in `data/db.json`.

## Project structure

- `server.js`, `config.js`: Express setup, route registration, printable invoice endpoint, and application settings.
- `public/`: browser UI (`index.html`), client behavior (`js/app.js`), and styles (`css/style.css`).
- `routes/`: HTTP handlers for products, orders, customers, and reports.
- `lib/`: business logic for orders, pricing, tax, coupons, inventory, ledger, reports, invoices, dates, and JSON storage.
- `data/db.json`: JSON-backed application data. Treat it as operational/sample data; avoid unrelated edits.

## Development conventions

- Keep changes focused and minimal. Preserve the existing CommonJS, JavaScript, Express, and JSON-storage patterns unless the task requires a broader change.
- Match the surrounding code's naming, formatting, and error-response conventions. Avoid introducing dependencies, frameworks, or abstractions without a clear need.
- Keep HTTP concerns in `routes/` and reusable business rules in `lib/`.
- Validate request data at the route boundary and use the existing pricing, tax, inventory, and ledger helpers where applicable.
- Do not add generated filler or unrelated documentation. Update this guide when project structure or established behavior materially changes.

## Order lifecycle

Order placement begins in `public/js/app.js` and posts to `POST /api/orders` in `routes/orders.js`. The route resolves product details, checks stock, validates coupons, calculates totals through `lib/pricing.js` and related helpers, optionally checks and updates Khata credit through `lib/ledger.js`, deducts inventory, creates the order, appends an audit entry, and persists the JSON store. The UI refreshes product, dashboard, and customer data after success.

Orders can be listed and retrieved through the order routes. `POST /api/orders/:id/cancel` marks an order cancelled and attempts to restore inventory and reverse any Khata debit. Printable invoices are served at `/orders/:id/invoice` by `lib/invoice.js`.

## Implementation notes

- `lib/store.js` synchronously reads and rewrites the complete `data/db.json` file. Preserve its existing format when changing stored records.
- `lib/pricing.js` calculates order totals using coupon rules and HSN-based tax rates from `lib/tax.js` and `config.js`.
- Invoice totals are calculated separately in `lib/invoice.js`. Check for consistency with the order ledger when changing tax or discount behavior; the GST reconciliation report compares the two.
- Inventory checks and order cancellation have important edge cases in the current implementation. Before changing them, inspect `lib/inventory.js`, `lib/orders.js`, and the order route together.
- The admin export key is configured in `config.js` and used by `GET /api/admin/export` in `routes/reports.js`. Do not expose or change access behavior without considering its security impact.

## Verification

`npm start` runs the application. The `npm test` script is currently a placeholder that exits with “no test specified”; do not treat it as a working test suite. For changes, use focused checks appropriate to the affected behavior and report any verification that could not be performed.
