#!/usr/bin/env python3
"""Prove the operator's parking rule: a draft changes no total anywhere.

Creates one draft supply and one draft expense through the API, then compares every
aggregate the UI reads before and after. The drafts stay on the site on purpose -
that is the workflow the operator asked for (park now, decide later).
"""

from __future__ import annotations

import json
import subprocess
import sys

PROBES = "/home/twenty/nova-probes"
TODAY = "2026-09-14"
SUPPLIER = "NOVA-TEST Supplier"
WAREHOUSE = "Main Warehouse - RN"
CATEGORY = "Administrative Expenses - RN"
SOURCE = "Cash - RN"


def run(spec):
    result = subprocess.run(
        ["python3", "/home/twenty/probe.py", json.dumps(spec, ensure_ascii=False)],
        capture_output=True,
        text=True,
    )
    if result.returncode != 0:
        print(result.stdout)
        print(result.stderr, file=sys.stderr)
        raise SystemExit(f"probe failed with {result.returncode}")


def payload(label):
    body = json.load(open(f"{PROBES}/{label}.json", encoding="utf-8"))
    return body.get("message", body)


def facts(label):
    data = payload(label)
    return {
        "supplies": data["supplies"],
        "sales": data["sales"],
        "expenses": data["expenses"],
        "supplier_payments": data["supplier_payments"],
    }


report = []

# 1) baseline
run(
    [
        {"label": "audit.ops_before", "method": "cardboard_management.reporting.get_operations_summary", "args": {"from_date": TODAY, "to_date": TODAY}},
        {"label": "audit.exp_before", "method": "cardboard_management.reporting.get_expense_summary", "args": {"from_date": TODAY, "to_date": TODAY}},
        {"label": "audit.inv_before", "method": "cardboard_management.inventory.get_inventory_overview", "args": {"selected_date": TODAY}},
        {"label": "audit.sup_before", "method": "cardboard_management.reporting.get_supplier_summary", "args": {"supplier": SUPPLIER}},
    ]
)
baseline = facts("audit.ops_before")
baseline_expense = payload("audit.exp_before")
baseline_inventory = payload("audit.inv_before")["summary"]
baseline_supplier = payload("audit.sup_before")
report.append(("baseline", baseline["supplies"]["count"], baseline["expenses"]["count"], baseline_inventory["stock_value"], baseline_supplier["supply_count"]))

# 2) park a draft supply and a draft expense
run(
    [
        {
            "label": "audit.park_supply",
            "method": "cardboard_management.cardboard_management.api.supply.create_supply",
            "args": {
                "posting_date": TODAY,
                "supplier": SUPPLIER,
                "item": "CARDBOARD-A",
                "gross_weight": 5000,
                "tare_weight": 1000,
                "rate_per_kg": 7,
                "discount_type": "No Discount",
                "vehicle_no": "PARKED-1",
                "driver_name": "مسودة معلّقة",
                "notes": "مسودة معلقة لاختبار قاعدة عدم الاحتساب قبل الاعتماد",
            },
        },
        {
            "label": "audit.park_expense",
            "method": "cardboard_management.cardboard_management.api.expenses.create_expense",
            "args": {
                "posting_date": TODAY,
                "expense_category": CATEGORY,
                "amount": 777,
                "payment_source": SOURCE,
                "description": "مسودة مصروف معلقة لاختبار قاعدة عدم الاحتساب",
            },
        },
    ]
)
parked_supply = payload("audit.park_supply")
parked_expense = payload("audit.park_expense")

# 3) re-read every aggregate
run(
    [
        {"label": "audit.ops_after", "method": "cardboard_management.reporting.get_operations_summary", "args": {"from_date": TODAY, "to_date": TODAY}},
        {"label": "audit.exp_after", "method": "cardboard_management.reporting.get_expense_summary", "args": {"from_date": TODAY, "to_date": TODAY}},
        {"label": "audit.inv_after", "method": "cardboard_management.inventory.get_inventory_overview", "args": {"selected_date": TODAY}},
        {"label": "audit.sup_after", "method": "cardboard_management.reporting.get_supplier_summary", "args": {"supplier": SUPPLIER}},
        {
            "label": "audit.draft_lists",
            "method": "cardboard_management.cardboard_management.api.supply.list_supplies",
            "args": {"status": "Draft", "page": 1, "page_size": 5},
        },
    ]
)
after = facts("audit.ops_after")
after_expense = payload("audit.exp_after")
after_inventory = payload("audit.inv_after")["summary"]
after_supplier = payload("audit.sup_after")
report.append(("after parking", after["supplies"]["count"], after["expenses"]["count"], after_inventory["stock_value"], after_supplier["supply_count"]))

print("parked supply :", parked_supply["name"], "| status:", parked_supply["status"], "| docstatus:", parked_supply["docstatus"])
print("parked expense:", parked_expense["name"], "| status:", parked_expense["status"], "| docstatus:", parked_expense["docstatus"])
print()
header = f"{'step':16} {'supplies':>9} {'expenses':>9} {'stock value':>12} {'supplier supplies':>17}"
print(header)
print("-" * len(header))
for label, supplies, expenses, stock, supplier_supplies in report:
    print(f"{label:16} {supplies:>9} {expenses:>9} {stock:>12} {supplier_supplies:>17}")
print()
print("operations expenses amount :", baseline["expenses"]["amount"], "->", after["expenses"]["amount"])
print("expense summary count      :", baseline_expense["expense_count"], "->", after_expense["expense_count"])
print("expense summary total      :", baseline_expense["total_expense_amount"], "->", after_expense["total_expense_amount"])
print("supplier outstanding       :", baseline_supplier["outstanding"], "->", after_supplier["outstanding"])
print("supplier supply value      :", baseline_supplier["supply_value"], "->", after_supplier["supply_value"])
print()
drafts = payload("audit.draft_lists")
print("draft supplies visible in the list:", [row["name"] for row in drafts["data"]])
print()
unchanged = (
    baseline == after
    and baseline_expense["expense_count"] == after_expense["expense_count"]
    and baseline_expense["total_expense_amount"] == after_expense["total_expense_amount"]
    and baseline_supplier["supply_count"] == after_supplier["supply_count"]
    and baseline_supplier["supply_value"] == after_supplier["supply_value"]
    and baseline_supplier["outstanding"] == after_supplier["outstanding"]
)
print("RESULT:", "DRAFTS COUNTED NOWHERE ✓" if unchanged else "A DRAFT LEAKED INTO A TOTAL ✗")
raise SystemExit(0 if unchanged else 1)
