#!/usr/bin/env python3
"""Build the Cardboard Supply weighing-ticket print format.

The layout, labels and field order follow the operator's paper ticket (the
authoritative source): brand header + ticket number + date, a two-column capture
table, the two weight/time cells, the emphasized net weight, an optional pricing
line and the weigher signature.

Run:  python3 build_ticket_format.py [output_dir]
"""

from __future__ import annotations

import json
import os
import sys

TARGET = "/home/twenty/frappe/cardboard-bench/apps/cardboard_management/cardboard_management/cardboard_management/print_format/cardboard_supply_ticket/cardboard_supply_ticket.json"

# Scalar metadata preserved from the previous definition (module ownership, paper
# size and margins stay exactly as they were).
PRESERVED = {
    "align_labels_right": 0,
    "creation": "2026-09-07 10:30:00.000000",
    "custom_format": 1,
    "disabled": 0,
    "doc_type": "Cardboard Supply",
    "docstatus": 0,
    "doctype": "Print Format",
    "font_size": 10,
    "line_breaks": 0,
    "margin_bottom": 8.0,
    "margin_left": 8.0,
    "margin_right": 8.0,
    "margin_top": 8.0,
    "modified": "2026-09-14 16:00:00.000000",
    "modified_by": "Administrator",
    "module": "Cardboard Management",
    "name": "Cardboard Supply Ticket",
    "owner": "Administrator",
    "page_number": "Hide",
    "print_format_for": "DocType",
    "print_format_type": "Jinja",
    "raw_printing": 0,
    "show_section_headings": 0,
    "standard": "Yes",
}

HTML = """{% set payment_labels = {"Unpaid": "غير مسدد", "Partially Paid": "مسدد جزئيًا", "Paid": "مسدد"} %}
<style>
  @page { size: A5 portrait; margin: 8mm; }
  .wt { direction: rtl; color: #111; font-family: "Noto Naskh Arabic", Tahoma, Arial, sans-serif; font-size: 10pt; line-height: 1.45; }
  .wt * { box-sizing: border-box; }
  .wt__header { border-bottom: 2px solid #111; display: table; padding-bottom: 2mm; width: 100%; }
  .wt__brand, .wt__meta { display: table-cell; vertical-align: top; }
  .wt__brand { text-align: right; width: 58%; }
  .wt__brand h1 { font-size: 16pt; margin: 0; }
  .wt__brand p { color: #333; font-size: 8.5pt; margin: 1mm 0 0; }
  .wt__meta { text-align: left; }
  .wt__ticket-no { border: 1.5px solid #111; border-radius: 2mm; display: inline-block; font-size: 10pt; font-weight: bold; margin-bottom: 2mm; padding: 1mm 3mm; }
  .wt__meta div { font-size: 9pt; margin-top: 0.8mm; }
  .wt__label { color: #444; }
  .wt__fields { border-collapse: collapse; margin-top: 3mm; width: 100%; }
  .wt__fields td { border: 1px solid #555; font-size: 10pt; padding: 1.6mm 2mm; vertical-align: middle; }
  .wt__fields td.wt__key { background: #f1f3f5; font-weight: bold; white-space: nowrap; width: 20%; }
  .wt__weights { border-collapse: collapse; margin-top: 3mm; table-layout: fixed; width: 100%; }
  .wt__weights td { border: 1px solid #555; padding: 2mm 1mm; text-align: center; width: 50%; }
  .wt__w-label { display: block; font-size: 9.5pt; font-weight: bold; }
  .wt__w-value { direction: ltr; display: block; font-size: 15pt; font-weight: bold; margin-top: 1mm; }
  .wt__w-time { color: #333; display: block; font-size: 8.5pt; margin-top: 1.5mm; }
  .wt__net { border: 2px solid #111; margin-top: 3mm; padding: 2.5mm; text-align: center; }
  .wt__net-label { font-size: 11pt; font-weight: bold; }
  .wt__net-value { direction: ltr; font-size: 21pt; font-weight: bold; margin: 0 3mm; }
  .wt__net-unit { border: 1px solid #111; font-size: 10pt; font-weight: bold; padding: 0.5mm 2mm; }
  .wt__pricing { border-collapse: collapse; font-size: 9pt; margin-top: 3mm; width: 100%; }
  .wt__pricing td { border: 1px solid #999; padding: 1.5mm 2mm; text-align: center; }
  .wt__pricing span { font-weight: bold; }
  .wt__footer { display: table; font-size: 9pt; margin-top: 6mm; width: 100%; }
  .wt__footer > div { display: table-cell; vertical-align: bottom; width: 50%; }
  .wt__sign { border-top: 1px dotted #555; margin-top: 8mm; padding-top: 1mm; text-align: center; }
  .wt__payment { border: 1px solid #999; font-size: 8.5pt; margin-top: 3mm; padding: 2mm; }
  .wt__payment table { border-collapse: collapse; width: 100%; }
  .wt__payment td { border: none; padding: 0.6mm 1mm; }
  .wt__payment-state { margin-top: 1mm; }
  .wt__payment-none { color: #444; text-align: center; }
</style>

<div class="wt" dir="rtl">
  <div class="wt__header">
    <div class="wt__brand">
      <h1>{{ doc.ticket_company_name or _("Cardboard Management") }}</h1>
      {% if doc.ticket_company_description %}<p>{{ doc.ticket_company_description }}</p>{% endif %}
      {% if doc.ticket_company_phone %}<p><bdi dir="ltr">{{ doc.ticket_company_phone }}</bdi></p>{% endif %}
    </div>
    <div class="wt__meta">
      <div class="wt__ticket-no">{{ _("تذكرة الوزن رقم") }} <bdi dir="ltr" data-ticket-field="ticket_no">{{ doc.name }}</bdi></div>
      <div><span class="wt__label">{{ _("التاريخ") }}:</span> <bdi dir="ltr" data-ticket-field="posting_date">{{ doc.get_formatted("posting_date") }}</bdi></div>
      <div><span class="wt__label">{{ _("المخزن") }}:</span> <span data-ticket-field="warehouse">{{ doc.warehouse or "" }}</span></div>
      {% if doc.purchase_invoice %}<div><span class="wt__label">{{ _("فاتورة الشراء") }}:</span> <bdi dir="ltr" data-ticket-field="purchase_invoice">{{ doc.purchase_invoice }}</bdi></div>{% endif %}
    </div>
  </div>

  <table class="wt__fields">
    <tr>
      <td class="wt__key">{{ _("الصنف") }}</td>
      <td data-ticket-field="item">{{ doc.ticket_item_name or doc.item }}{% if doc.item %} <span class="wt__label">({{ doc.item }})</span>{% endif %}</td>
      <td class="wt__key">{{ _("نوع الحركة") }}</td>
      <td>{{ _("وارد") }}</td>
    </tr>
    <tr>
      <td class="wt__key">{{ _("العميل / المورد") }}</td>
      <td data-ticket-field="supplier">{{ doc.ticket_supplier_name or doc.supplier }}</td>
      <td class="wt__key">{{ _("نوع السيارة") }}</td>
      <td data-ticket-field="vehicle_type"></td>
    </tr>
    <tr>
      <td class="wt__key">{{ _("اسم السائق") }}</td>
      <td data-ticket-field="driver_name">{{ doc.driver_name or "" }}</td>
      <td class="wt__key">{{ _("رقم السيارة") }}</td>
      <td data-ticket-field="vehicle_no">{{ doc.vehicle_no or "" }}</td>
    </tr>
    <tr>
      <td class="wt__key">{{ _("رقم إذن التسليم") }}</td>
      <td data-ticket-field="delivery_permit"></td>
      <td class="wt__key">{{ _("رقم المقطورة") }}</td>
      <td data-ticket-field="trailer_no"></td>
    </tr>
    <tr>
      <td class="wt__key">{{ _("رقم الشحنة") }}</td>
      <td data-ticket-field="shipment_no"></td>
      <td class="wt__key">{{ _("ملاحظات") }}</td>
      <td data-ticket-field="notes">{{ doc.notes or "" }}</td>
    </tr>
  </table>

  <table class="wt__weights">
    <tr>
      <td>
        <span class="wt__w-label">{{ _("الوزن الأول (القائم)") }}</span>
        <span class="wt__w-value" data-ticket-field="gross_weight">{{ doc.get_formatted("gross_weight") }} {{ doc.ticket_weight_uom }}</span>
        <span class="wt__w-time">{{ _("وقت الدخول") }}: <bdi dir="ltr">{{ doc.get_formatted("creation") }}</bdi></span>
      </td>
      <td>
        <span class="wt__w-label">{{ _("الوزن الثاني (الفارغ)") }}</span>
        <span class="wt__w-value" data-ticket-field="tare_weight">{{ doc.get_formatted("tare_weight") }} {{ doc.ticket_weight_uom }}</span>
        <span class="wt__w-time">{{ _("وقت الخروج") }}: <bdi dir="ltr">{{ doc.get_formatted("modified") }}</bdi></span>
      </td>
    </tr>
  </table>

  <div class="wt__net">
    <span class="wt__net-label">{{ _("صافي الوزن") }}</span>
    <span class="wt__net-value" data-ticket-field="net_weight">{{ doc.get_formatted("net_weight") }}</span>
    <span class="wt__net-unit">{{ doc.ticket_weight_uom }}</span>
  </div>

  <table class="wt__pricing">
    <tr>
      <td>{{ _("الوزن المحتسب") }}: <span data-ticket-field="payable_weight">{{ doc.get_formatted("display_payable_weight") }} {{ doc.ticket_weight_uom }}</span></td>
      <td>{{ _("خصم الوزن") }}: <span data-ticket-field="discount_weight">{{ doc.get_formatted("discount_weight") }} {{ doc.ticket_weight_uom }}</span></td>
      <td>{{ _("سعر الكيلو") }}: <span data-ticket-field="rate_per_kg">{{ doc.get_formatted("rate_per_kg") }}</span></td>
      <td>{{ _("الإجمالي") }}: <span data-ticket-field="total_amount">{{ doc.get_formatted("total_amount") }}</span></td>
    </tr>
  </table>

  {% if doc.integration_status == "Integrated" and doc.purchase_invoice %}
  <div class="wt__payment">
    <table>
      <tr>
        <td>فاتورة الشراء: <bdi dir="ltr" data-ticket-field="purchase_invoice">{{ doc.purchase_invoice }}</bdi></td>
        <td>إجمالي الفاتورة: <span data-ticket-field="invoice_total">{{ doc.get_formatted("invoice_total", currency=doc.ticket_currency) }}</span></td>
      </tr>
      <tr>
        <td>المدفوع: <span data-ticket-field="paid_amount">{{ doc.get_formatted("invoice_paid_amount", currency=doc.ticket_currency) }}</span></td>
        <td>المتبقي: <span data-ticket-field="outstanding_amount">{{ doc.get_formatted("purchase_invoice_outstanding", currency=doc.ticket_currency) }}</span></td>
      </tr>
    </table>
    <div class="wt__payment-state">
      حالة السداد: <b data-ticket-field="payment_status" data-payment-state="{{ doc.payment_status }}">{{ payment_labels.get(doc.payment_status, doc.payment_status) }}</b>
      <span class="wt__payment-state">· العملة: <bdi dir="ltr" data-ticket-field="currency">{{ doc.ticket_currency }}</bdi></span>
    </div>
  </div>
  {% else %}
  <div class="wt__payment wt__payment-none">Not Integrated — No Purchase Invoice</div>
  {% endif %}

  <div class="wt__footer">
    <div>
      القائم بالوزن: <span data-ticket-field="prepared_by">{{ doc.ticket_prepared_by }}</span>
    </div>
    <div class="wt__sign">توقيع المستلم</div>
  </div>
</div>
"""


def main() -> int:
    target = sys.argv[1] if len(sys.argv) > 1 else TARGET
    payload = {**PRESERVED, "html": HTML}
    os.makedirs(os.path.dirname(target), exist_ok=True)
    with open(target, "w", encoding="utf-8", newline="\n") as handle:
        json.dump(payload, handle, ensure_ascii=False, indent=1)
    print(f"wrote {target} ({len(HTML)} html chars)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
