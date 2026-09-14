# Backend findings — Nova real-mode verification & production hardening

Site: `cardboard.localhost` · App: `cardboard_management` (Frappe v15 + ERPNext) · 2026-09-14
Method: every app-owned RPC was called **against the live site** (cookie session + CSRF), first through the
dev proxy and finally through the production-shaped origin (`http://cardboard.localhost:5200`, built bundle).
The legacy `frontend/` was never modified.

Legend: **BG** = backend/API observation · **INF** = dev-infrastructure observation · ✅ fixed in this pass ·
📄 documented only.

---

## INF-01 📄 — Real-mode dev origin must be `cardboard.localhost:5173` (was blocking)

`frontend/vite.config.ts` (the existing frontend) points the `/api` proxy at `http://127.0.0.1:8000` with
`changeOrigin: true` **and** `headers: { Host: 'cardboard.localhost' }`.

Measured on Vite 8 (`http-proxy-3`):

| Client Host | Proxy config | Result |
| --- | --- | --- |
| `127.0.0.1:5173` | `changeOrigin: true` + `headers.Host` (existing) | `is not whitelisted` for every app method |
| `127.0.0.1:5173` | `changeOrigin: false` + `configure` hook setting `host` | `is not whitelisted` — the hook cannot win |
| `cardboard.localhost:5173` | `changeOrigin: false`, no override | **works** (session + CSRF + every app method) |

Frappe resolves the site from the incoming `Host` header (port ignored), and neither the `headers` option nor a
`proxyReq` hook can rewrite it: the browser's host is what the backend sees. Consequences: open the UI on
`http://cardboard.localhost:5173` (which is also the only origin where the Desk session cookie is sent), keep
`changeOrigin: false`, and delete the misleading Host override. Nova's config documents this inline.

**Same class of bug found again in Nova's own preview proxy** (`serve.py`): Python's `urllib` silently drops a
caller-supplied `Host` header, so the preview answered as a *different* site. Rewritten on `http.client`, which
sends exactly the headers it is given — this is what makes the production-shaped verification trustworthy.

## INF-02 📄 — Cookies are scoped to the site host, so test on the site origin

A session created with an explicit `Host:` override is stored by the client under that host, and a later request
to `127.0.0.1:<port>` does not send it — the API then answers as **Guest** and the message looks like a
permission problem. Always exercise the contract on the site origin (`http://cardboard.localhost:<port>`).

## BG-01 📄 — Broken module path in the existing frontend (not fixed by request)

The existing UI calls `cardboard_management.api.supply.list_supplies`. That module does not exist — the app
package has an **empty stray `api/` directory** at that level, while the real one is
`cardboard_management.cardboard_management.api`:

```
[417] ValidationError: فشل الحصول على طريقة للأمر
      cardboard_management.api.supply.list_supplies مع No module named 'cardboard_management.api.supply'
```

Fix (their repository, one prefix): `cardboard_management.cardboard_management.api.supply.list_supplies`.
Nova already uses the correct path.

## BG-02 ✅ — Create-capability endpoint for sales

Added `sales.get_create_capabilities` (whitelisted, mirrors `supply.get_create_capabilities`).
Verified live: `{"can_create": true, "can_submit": true}`. Nova's `/sales/new` now gates its save/submit buttons
on that answer instead of assuming the right exists. Covered by DB-free contracts
(`tests/test_api_gap_repairs.py`) and fixture-driven transport specs.

## BG-03 📄 — Supplier payment requires an outstanding invoice (by design)

`create_supplier_payment` rejects a supplier without outstanding invoices:
`[417] ValidationError: لا توجد فواتير مستحقة لهذا المورد`. Reproduced with a brand-new supplier, and the same
payload succeeds for one with a submitted supply. The message is correctly Arabic. Nova now warns before submit
when `get_supplier_payment_context.current_supplier_outstanding === 0`. No API change needed — the eligibility
signal is already derivable.

## BG-04 ✅ — Supplier history is submitted-only, and now says so

Drafts stay out of `supply_count`, `supply_history` and statement `entries` (verified: a supplier whose only
supply is a Draft reports zero). That rule is now **stated by the server** as `submitted_only: true` in both
`get_supplier_summary` and `get_supplier_statement`, so the client no longer hardcodes the explanation.

## BG-05 ✅ — Reporting date validation now speaks Arabic

`reporting._date_range` throws `_("To Date cannot be in the future")`, but `translations/ar.csv` had no entry,
so an Arabic operator saw English. Added four missing entries (plus "From Date cannot be after To Date",
"Invalid reporting status: {0}", "Cardboard item is outside the configured reporting scope"), refreshed the
translation cache, and verified live:

```
get_inventory_movement / get_expense_summary with to_date = 2026-09-30
→ [417] ValidationError: لا يمكن أن يكون تاريخ النهاية في المستقبل
```

Nova also caps every date picker at today, so the rejection is unreachable by accident. The production preview
also proves the CSRF rejection message is Arabic (`طَلَبٌ غَيْرُ…`).

## BG-06 ✅ — Serialized `frappe.throw` messages no longer hide the reason

Thrown errors arrive in `_server_messages` as JSON wrapping
`<details><summary>sentence</summary>traceback</details>`. Nova's transport now takes the `<summary>` sentence,
strips tags/entities and refuses anything that still looks like a traceback. Proven against **captured live
payloads** (the Arabic date message and the real broken-route message) in `errors.spec.ts`.

## BG-07 ✅ — Supplier statement is bounded and windowed

`get_supplier_statement` accepted no pagination, so one long-lived supplier produced an unbounded payload.
It now accepts `page` / `page_size` (default 200, hard maximum 500) and always returns `page`, `page_size`,
`total`, `has_more`. Verified live: `page_size=2` honoured; `page_size=99999` clamped to **500** with
`total`/`has_more` intact. Nova requests 200 per page and offers «عرض المزيد» while `has_more` is true.

## BG-08 📄 — No delete path for mistaken drafts

The contract exposes create / update / submit / cancel but no delete, so drafts can only be removed from Desk.
Left as a deliberate product decision (silent drafts are harmless; they accumulate).

## BG-09 📄 / BG-10 📄 — Field naming inconsistencies (declined, by design)

* `get_inventory_movement` totals use `inbound_quantity`/`outbound_quantity`/`net_quantity`, while its `by_item`
  and `by_date` rows use `inbound`/`outbound`/`net`.
* `supply.lookup_suppliers` sends `{name, supplier_name}`; `supplier_payments.lookup_suppliers` sends
  `{supplier, supplier_name, disabled}`.

Both are mapped explicitly in Nova and pinned by fixture-driven specs, so a change turns a test red instead of
rendering a blank row. Renaming would be a breaking change for existing consumers with no functional gain, so it
is documented rather than "fixed".

## Contract nuance 📄 — `session.get_session_context` is GET-only

Calling it with POST answers `PermissionError: غير مسموح به` — a permission-looking error for what is really an
HTTP-verb restriction. Nova fetches it with GET, which is also where the CSRF token comes from.

---

## Verification of the backend changes

| Gate | Result |
| --- | --- |
| `python3 -m unittest cardboard_management.tests.test_api_gap_repairs` | 12 tests OK (new DB-free contracts) |
| `test_reporting_source` / `test_arabic_translation_source` | OK (no regression) |
| `bench --site cardboard.localhost run-tests --app cardboard_management --skip-before-tests --skip-test-records` | **Ran 288 tests — OK (skipped=3)** |
| Live probes (dev proxy) | `sales.get_create_capabilities`, windowed statement, Arabic message — all confirmed |
| Live probes (production-shaped origin, built bundle) | session, caps, statement window, inventory, settings — all confirmed |

Backend changes are additive only: no schema change, so **no `bench migrate` was required** (and none was run).
