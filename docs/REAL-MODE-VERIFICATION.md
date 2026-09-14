# Nova — real-mode verification log

Target site: `cardboard.localhost` (Frappe v15 + ERPNext) · Dev origin: `http://cardboard.localhost:5173`
Verified: 2026-09-14 · Operator account: `muhamedeiddev@gmail.com`

Nothing outside `~/cardboard-frontend-nova` was modified. The existing `frontend/` and the backend app were
read-only during this verification.

## 1. How real mode is wired

* `VITE_API_MODE=real` (default). Mock data is reachable only with an explicit `VITE_API_MODE=mock`.
* Vite proxies `/api` → `http://127.0.0.1:8000` with `changeOrigin: false` and **no** Host override, so the
  browser's `Host: cardboard.localhost:5173` reaches Frappe and selects the site (see BG/INF-01).
* Transport: cookie session (`credentials: 'include'`) + CSRF token from
  `cardboard_management.cardboard_management.api.session.get_session_context`, then POST JSON to
  `/api/method/<dotted.path>` for every call.
* App-owned `*_error` envelopes are preferred over generic HTTP messages; serialized Frappe metadata is
  parsed for the human sentence only, never rendered raw.

Run it:

```bash
# in WSL, as the runtime owner
cd ~/cardboard-frontend-nova
source ~/.nvm/nvm.sh
npm run dev            # http://cardboard.localhost:5173  (real mode)
npm run dev:mock       # http://cardboard.localhost:5180  (mock mode)
```

## 2. What was proven against the live site

| Area | Evidence |
| --- | --- |
| Session + CSRF through the proxy | `GET /api/method/…get_session_context` → `{user, csrf_token}`; authenticated `POST` accepted |
| Supply list/detail | `CS-2026-00009` (Submitted, Unpaid, purchase invoice `ACC-PINV-2026-00009`, payable 5122.8 kg) |
| Supply create | created draft `CS-2026-00010` for `NOVA-TEST Supplier` (gross 6280 / tare 1080 / 6.5 per kg → derived weights returned) |
| Sales create + buyers | created draft `SALE-2026-00001` (`NOVA-TEST Buyer`); `lookup_buyers` then returned that buyer |
| Expense create | created draft `QE-2026-00001` (category + payment source names resolved by the server) |
| Supplier create | created `NOVA-TEST Supplier`; detail + capabilities readable |
| Payment create | draft `CSP-2026-00005` for `UAT W01 Supplier 20260913`; a supplier without outstanding invoices is refused (BG-03) |
| Inventory | `read.inventory_after` snapshot: state `ok`, item `CARDBOARD-A` |
| Reports | operations today, movement, expense summary, supplier summary + statement — all rendered from live payloads |
| Settings | `get_operational_settings` + all five bounded lookups (warehouses scoped to the company) |
| Legacy path check | `cardboard_management.api.supply.list_supplies` → module missing (BG-01) |

Raw captures of every call are kept in `~/nova-probes/*.json` and were converted into TypeScript fixtures
(`src/services/real/__fixtures__/observed.ts`, 38 payloads) so the transport specs assert against reality
instead of hand-typed guesses.

## 3. Frontend consequences fixed in this pass (frontend only)

1. `vite.config.ts` — site-selecting proxy documented and corrected (no misleading Host override).
2. `src/services/api/errors.ts` — extract the operator sentence from serialized `_server_messages`, refuse
   tracebacks; validation reasons are now visible (BG-06).
3. `src/services/contracts/expense.ts` + `src/services/real/expense.ts` — read `capabilities.can_create`
   from the new-expense schema.
4. `ExpenseFormPage.vue` / `PaymentFormPage.vue` — save/submit buttons are granted by the server capability,
   never assumed; an explanatory line appears when nothing is granted.
5. `PaymentFormPage.vue` — warns when the selected supplier has no outstanding invoice (BG-03).
6. `ReportRoutePage.vue`, `InventoryPage.vue`, `MovementPage.vue` — date pickers capped at today (BG-05);
   supplier filter now distinguishes "lookup failed" from "no suppliers exist".
7. `SettingsPage.vue` — lookups load after the settings, and warehouses reload when the company changes.
8. `SupplierDetailPage.vue` — states that metrics/history cover submitted documents only (BG-04).
9. `SupplyDetailPage.vue` + supply contract/adapter — the purchase invoice is now surfaced.

## 4. Verification gates

```
npm run typecheck   # vue-tsc -b
npm run lint        # eslint . --max-warnings=0
npm run test        # vitest run  (transport + error-handling specs)
npm run build       # real bundle
npm run build:mock  # mock bundle
```

Results of this pass: see the handoff message (recorded verbatim from the runs).

## 5. Test records created on the site (for cleanup)

| Document | Name | State |
| --- | --- | --- |
| Supplier | `NOVA-TEST Supplier` | enabled |
| Supply (Carton Supply) | `CS-2026-00010` | Draft |
| Sale (Carton Sale) | `SALE-2026-00001` | Draft |
| Expense | `QE-2026-00001` | Draft |
| Supplier Payment | `CSP-2026-00005` | Draft |

All five are **drafts**. No document was submitted, cancelled or deleted, so no stock ledger, GL entry or
payment allocation was created by this verification. Drafts can be removed from the Desk UI (the API has no
delete method — BG-08).

## 6. Still user-owned (not verified by the agent)

* Visual acceptance of both themes in a real browser, on the site origin.
* Submit → cancel round trips for supply/sale/payment/expense: these move stock and accounting entries, so
  they were deliberately left out of an automated pass. One reversible candidate: submit + cancel
  `CS-2026-00010` (its cancel restores the stock per the supply contract).
