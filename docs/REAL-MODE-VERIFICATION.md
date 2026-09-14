# Nova — real-mode verification & production hardening

Site: `cardboard.localhost` (Frappe v15 + ERPNext) · Verified: 2026-09-14
Origins: dev `http://cardboard.localhost:5173` · production-shaped `http://cardboard.localhost:5200`
Operator account used for verification: `muhamedeiddev@gmail.com`

Nothing outside `~/cardboard-frontend-nova` was modified except the additive backend changes listed in
`BACKEND-FINDINGS.md`. The legacy `frontend/` was untouched.

## 1. How real mode is wired

* `VITE_API_MODE=real` (default). A **production build refuses `mock` outright** (`src/app/bootstrap/config.ts`).
* Vite proxies `/api` → `http://127.0.0.1:8000` with `changeOrigin: false` and no Host override, so the browser's
  `Host: cardboard.localhost:5173` reaches Frappe and selects the site (INF-01).
* Transport: cookie session (`credentials: 'include'`) + CSRF token from
  `cardboard_management.cardboard_management.api.session.get_session_context` (GET), then POST JSON to
  `/api/method/<dotted.path>`. A stale token is refreshed once and the call replayed; every request is bounded by
  30s; app-owned `*_error` envelopes beat generic HTTP messages; serialized Frappe metadata is parsed for the
  human sentence only.

Run it:

```bash
cd ~/cardboard-frontend-nova && source ~/.nvm/nvm.sh
npm run dev                                    # real mode  → http://cardboard.localhost:5173
npm run dev:mock                               # fixture    → http://cardboard.localhost:5180
python3 serve.py 5200 --dist dist --proxy http://127.0.0.1:8000 --host-header cardboard.localhost
```

## 2. Verified against the live site

| Area | Evidence |
| --- | --- |
| Session + CSRF through a proxy | `{user, csrf_token}` on both the dev proxy and the production-shaped origin |
| Supply | list/detail of `CS-2026-00009` (Submitted, Unpaid, invoice `ACC-PINV-2026-00009`); draft `CS-2026-00010` created, then the operator submitted it → `Integrated`, invoice `ACC-PINV-2026-00006` |
| Sales | draft `SALE-2026-00001` created; buyer suggestions and item lookups confirmed; create-capability endpoint confirmed |
| Supplier | `NOVA-TEST Supplier` created; detail + capabilities read; summary/statement submitted-only rule confirmed on both sides |
| Payment | draft `CSP-2026-00005`; a supplier without outstanding invoices is refused with the Arabic message |
| Expense | draft `QE-2026-00001`; categories (25) and payment sources confirmed |
| Inventory / reports / settings | snapshot, all eight reports, settings + five bounded lookups — real payloads |
| Failure paths | future-date rejection, CSRF rejection, missing-route rejection — all surface a usable Arabic sentence |

Raw captures of every call live in `~/nova-probes/*.json`; 41 of them were converted into TypeScript fixtures
(`src/services/real/__fixtures__/observed.ts`) so the transport specs assert reality instead of guesses.

## 3. Defects found and fixed in Nova

| # | Defect | Fix |
| --- | --- | --- |
| 1 | Proxy could not select the site; every real-mode call failed (INF-01) | config corrected and documented; the app must be opened on the site origin |
| 2 | Validation reasons were hidden behind a generic fallback (BG-06) | extract the operator sentence from `_server_messages`, refuse tracebacks |
| 3 | Payment supplier select rendered **blank, selectable rows** (`lookup_suppliers` returns `supplier_name`, the adapter read `supplierName`) | explicit mapping with a never-blank fallback; `disabled` passed through; native popup colours pinned for dark mode |
| 4 | **Supplier statement tab showed payments only** — the merged timeline was dropped by the mapper | statement now returns the server's `entries` timeline (supplies + payments) and renders it |
| 5 | Statement response was unbounded | server-side window + «عرض المزيد» in the UI |
| 6 | Expense/payment create buttons assumed permission | gated on the server's `can_create`; an explanatory line appears when nothing is granted |
| 7 | A future date could be picked and would be rejected by the server | every date picker capped at today |
| 8 | Supplier filters mixed "lookup failed" with "no suppliers exist" | distinct message, and the load button disables only on failure |
| 9 | Settings lookups loaded before the settings, warehouses not scoped to the company | lookups load after settings and reload when the company changes |
| 10 | Print silently did nothing when the popup was blocked | explicit operator message |
| 11 | A render error blanked the app; a network outage looked like a signed-out operator | `AppErrorBoundary` + session gate distinguishing signed-out / unreachable; global error handler |
| 12 | A hung request left a spinner forever; a stale CSRF token looked like a permission error | 30s abort + one automatic token refresh |
| 13 | Purchase invoice number was never displayed | added to the supply detail (and to the DTO) |

## 4. Verification gates (this pass)

```
npm run typecheck   # 0 errors
npm run lint        # 0 warnings (--max-warnings=0)
npm run test        # 14 files / 80 tests passed
npm run build       # real bundle ✓ (mock mode refused by design)
npm run build:mock  # fixture bundle ✓
git diff --check    # clean
```

The suite covers the transport contract (paths, args, DTO mapping against live-captured payloads), operator error
text, the session gate, the production config guard, the select component, and the **mock runtime** — fixture mode
is the demo path, so it is held to the same shapes (`src/services/mocks/services.spec.ts`).

Production-shaped verification (built `dist/` served by `serve.py` with a same-origin `/api` proxy):

```
SPA root      = 200            deep link (/suppliers/SUP-0001) = 200
asset header  = Cache-Control: public, max-age=31536000, immutable
session       = {user: muhamedeiddev@gmail.com, csrf_token: …}
sales caps    = {can_create, can_submit}
statement     = page/page_size/total/has_more + submitted_only + entries
inventory     = state ok, one row, company/warehouse/currency from the server
settings      = company El Nos, default warehouse, capabilities
```

Backend suite for the additive API changes: `Ran 288 tests — OK (skipped=3)`.

## 5. Test records created on the site (cleanup)

| Document | Name | State |
| --- | --- | --- |
| Supplier | `NOVA-TEST Supplier` | enabled |
| Supply | `CS-2026-00010` | **Submitted** (the operator approved it; invoice `ACC-PINV-2026-00006`) |
| Sale | `SALE-2026-00001` | Draft |
| Expense | `QE-2026-00001` | Draft |
| Supplier Payment | `CSP-2026-00005` | Draft |

`CS-2026-00010` created native stock and accounting documents when it was submitted. If it should be removed,
cancel it through the UI (cancel restores stock and reverses the payable) rather than deleting rows.

## 6. Still owned by the product owner

* Arabic/RTL visual acceptance of both themes on the site origin.
* Submit → cancel round trips for sale, payment and expense (the supply round trip was exercised).
* `frontend/` (legacy) fixes for INF-01 and BG-01 — documented, deliberately untouched.
