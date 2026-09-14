# Backend findings — Nova real-mode verification

Site: `cardboard.localhost` · App: `cardboard_management` (Frappe v15 + ERPNext) · Date: 2026-09-14
Method: every app-owned RPC was called **against the live site** through the Vite dev proxy with a real
session cookie + CSRF token. Nothing in the backend or in the existing `frontend/` was modified.

Legend: **BG** = backend/API observation · **INF** = dev-infrastructure observation.

---

## INF-01 — Real-mode dev origin must be `cardboard.localhost:5173` (blocking)

`frontend/vite.config.ts` (existing project) points the `/api` proxy at `http://127.0.0.1:8000` with
`changeOrigin: true` **and** `headers: { Host: 'cardboard.localhost' }`.

Measured on Vite 8 (`http-proxy-3`):

| Client Host | Proxy config | Result through the proxy |
| --- | --- | --- |
| `127.0.0.1:5173` | `changeOrigin: true` + `headers.Host` (existing) | `is not whitelisted` for every app method |
| `127.0.0.1:5173` | `changeOrigin: false` + `configure` hook setting `host` | `is not whitelisted` (hook does not win) |
| `cardboard.localhost:5173` | `changeOrigin: false`, no override | **works** — session + CSRF + app methods |
| `cardboard.localhost:8000` (direct, no proxy) | — | works |

Frappe resolves the site from the incoming `Host` header and strips the port, so `cardboard.localhost:5173`
resolves correctly. Neither the `headers` option nor a `proxyReq` hook can rewrite the outgoing host — the
browser's host is what the backend sees.

Consequences
1. Open Nova (and the existing frontend) at **http://cardboard.localhost:5173**, not `localhost:5173`.
2. This is also the only origin where the Desk session cookie is sent, so the operator stays logged in.
3. `changeOrigin: true` in the existing config is actively harmful in real mode; the `headers.Host` override
   gives a false sense of safety. Nova's config documents this (see `vite.config.ts`).

## BG-01 — Broken module path in the existing frontend (blocking, not fixed)

The existing UI calls `cardboard_management.api.supply.list_supplies`. That module does not exist:

```
[417] ValidationError: Failed to get method for command
      cardboard_management.api.supply.list_supplies
      with No module named 'cardboard_management.api.supply'
```

Correct path (used by Nova): `cardboard_management.cardboard_management.api.supply.list_supplies`.
Impact: the supplies screen in the existing frontend can never load in real mode.
Left untouched on purpose — it is your repository.

## BG-02 — No create-capability endpoint for sales

* `supply.get_create_capabilities` → `{ can_create, can_submit }` ✅
* `sales.*` → only `get_capabilities(name)` (per document, after a record exists) ❌

Impact: a create form for sales cannot learn `can_create` before the first save, so it must keep its save
buttons enabled and rely on the server rejection. Nova does exactly that and says so in the UI copy.
Suggested fix (backend, your call): add `sales.get_create_capabilities` mirroring supply.

## BG-03 — Supplier payment requires an outstanding invoice

`create_supplier_payment` rejects a supplier without outstanding invoices:

```
[417] ValidationError: لا توجد فواتير مستحقة لهذا المورد
```

Reproduced with the freshly created `NOVA-TEST Supplier` (no submitted supply) — the same payload succeeds
for `UAT W01 Supplier 20260913` (has submitted `CS-2026-00009`). The message is correctly Arabic, and Nova
now warns before submitting when `get_supplier_payment_context.current_supplier_outstanding === 0`.
Suggestion: expose an explicit eligibility flag in the context payload so the form can disable itself.

## BG-04 — Supplier summary/statement count submitted documents only

For a supplier whose only supply is a **Draft**, `get_supplier_summary` returns `supply_count = 0` with an
empty `supply_history`, and `get_supplier_statement` returns empty `entries`. Verified with
`NOVA-TEST Supplier` (draft `CS-2026-00010`).
Not a defect — but it is invisible to an operator, so Nova states it in the supplier page copy.
Suggestion: optional `include_drafts` flag, or echo the applied `docstatus` filter in the payload.

## BG-05 — Future dates are rejected, with an untranslated message

```
get_operations_summary / get_inventory_movement with to_date = 2026-09-30
→ [417] ValidationError: To Date cannot be in the future
```

Two consequences: (1) the sentence reaches an Arabic operator in English; (2) the reporting layer returns it
outside the feature `*_error` envelope. Nova now caps every date picker at today, so a user cannot trigger
it by accident. Suggestion: wrap the message with `_()` and/or reuse the `reporting_error` envelope.

## BG-06 — `frappe.throw` messages arrive as serialized HTML

Thrown validation errors come back in `_server_messages` as a JSON array wrapping
`{"message": "<details><summary>…</summary>…</details>"}`. A naive client shows a generic fallback and loses
the reason. Nova's transport now extracts the human sentence and refuses anything that still looks like a
traceback (`fix` in `src/services/api/errors.ts`). No backend change required — recorded because the reason
was invisible in the pre-fix UI.

## BG-07 — `get_supplier_statement` is unbounded

The endpoint accepts `supplier`, `from_date`, `to_date` — no `page` / `page_size`. The response carries one
entry per supply and per payment for the whole history. Suggestion: optional pagination with a bounded
default, matching the `Page<>` envelope used everywhere else.

## BG-08 — No delete/unlink path for mistaken drafts

The contract exposes create / update / submit / cancel but no delete. Drafts created during verification
(see `REAL-MODE-VERIFICATION.md`) can only be removed from the Desk UI. Worth documenting for operators, and
worth a deliberate decision (silent drafts are harmless; they just accumulate).

## BG-09 — Field naming is inconsistent between a report's totals and its rows

`get_inventory_movement` returns `inbound_quantity` / `outbound_quantity` / `net_quantity` at the top level,
but the same quantities as `inbound` / `outbound` / `net` inside every `by_item` and `by_date` row. Nova maps
both correctly (covered by a fixture-driven spec), but any new client has to learn the difference.
Cosmetic suggestion: use one spelling in both places.

## Contract nuance — `session.get_session_context` is GET-only

The method declares `methods=["GET"]`, so calling it with POST answers
`PermissionError: غير مسموح به` (a permission-looking error for what is really a method restriction). Nova
fetches it with GET before any write, which is also where the CSRF token comes from. Worth knowing before
debugging a "permission" report that is actually a wrong HTTP verb.

---

## Fields observed on the wire that Nova intentionally does not consume

Harmless extra keys, listed so nobody assumes the DTO is incomplete:

* list rows: `creation` (supply, sales, expense, payment)
* reports / inventory: `scope`, `activity`, `items`, `item_groups`
* supplier schema: `editable_fields`, `server_owned_fields` (Nova maps `system_managed_fields` → read-only)
* `get_operations_summary`: nested `inventory_movement` (Nova uses the dedicated movement endpoint)

## Endpoints verified live (all app-owned methods the UI uses)

`suppliers` list/get/schema/capabilities/create · `supply` list/get/create/capabilities/create-capabilities/preview/print-action ·
`sales` list/get/create/lookup-buyers/lookup-items · `supplier_payments` list/get/schema/context/lookup-suppliers/lookup-modes/create ·
`expenses` list/get/schema/categories/sources/create · `inventory.get_inventory_overview` ·
`reporting` operations/movement/expense-summary/supplier-summary/supplier-statement ·
`operational_settings` get + all five lookups · `session.get_session_context`.
