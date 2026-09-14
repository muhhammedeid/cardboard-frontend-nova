/**
 * Raw `message` payloads captured from the live Frappe site
 * (`cardboard.localhost`) through the Vite dev proxy.
 *
 * Generated from the probe captures; do not hand-edit. They exist so the
 * transport specs prove every converter reads the field the backend
 * actually sends - a wrong snake_case key turns into a red test instead of
 * a silently empty screen.
 */

export const SUPPLY_LIST = {
  "data": [
    {
      "name": "CS-2026-00009",
      "posting_date": "2026-09-14",
      "supplier": "UAT W01 Supplier 20260913",
      "item": "CARDBOARD-A",
      "payable_weight": 100.0,
      "total_amount": 100.0,
      "docstatus": 1,
      "supplier_name": "UAT W01 Supplier 20260913",
      "item_name": "Cardboard Type A",
      "status": "Submitted"
    },
    {
      "name": "CS-2026-00006",
      "posting_date": "2026-09-13",
      "supplier": "محمد عيد",
      "item": "CARDBOARD-A",
      "payable_weight": 3100.0,
      "total_amount": 0.0,
      "docstatus": 1,
      "supplier_name": "محمد عيد",
      "item_name": "Cardboard Type A",
      "status": "Submitted"
    },
    {
      "name": "CS-2026-00007",
      "posting_date": "2026-09-13",
      "supplier": "محمد عيد",
      "item": "CARDBOARD-A",
      "payable_weight": 3100.0,
      "total_amount": 0.0,
      "docstatus": 0,
      "supplier_name": "محمد عيد",
      "item_name": "Cardboard Type A",
      "status": "Draft"
    }
  ],
  "page": 1,
  "page_size": 3,
  "total": 6,
  "has_more": true
}

export const SUPPLY_DETAIL = {
  "name": "CS-2026-00009",
  "posting_date": "2026-09-14",
  "supplier": "UAT W01 Supplier 20260913",
  "item": "CARDBOARD-A",
  "warehouse": "Main Warehouse - RN",
  "gross_weight": 100.0,
  "tare_weight": 0.0,
  "net_weight": 100.0,
  "discount_type": "No Discount",
  "discount_value": 0.0,
  "discount_weight": 0.0,
  "payable_weight": 100.0,
  "display_payable_weight": 100.0,
  "rate_per_kg": 1.0,
  "total_amount": 100.0,
  "purchase_invoice": "ACC-PINV-2026-00005",
  "payment_status": "Unpaid",
  "purchase_invoice_outstanding": 100.0,
  "invoice_total": 100.0,
  "invoice_paid_amount": 0.0,
  "integration_status": "Integrated",
  "vehicle_no": "",
  "driver_name": "",
  "weight_ticket": null,
  "supplier_receipt": null,
  "notes": "",
  "docstatus": 1,
  "supplier_name": "UAT W01 Supplier 20260913",
  "item_name": "Cardboard Type A",
  "status": "Submitted",
  "capabilities": {
    "can_edit": false,
    "can_submit": false,
    "can_cancel": false,
    "can_capture_gross": false,
    "can_capture_tare": false,
    "can_print": true
  }
}

export const SUPPLY_DRAFT_DETAIL = {
  "name": "CS-2026-00010",
  "posting_date": "2026-09-14",
  "supplier": "NOVA-TEST Supplier",
  "item": "CARDBOARD-A",
  "warehouse": "Main Warehouse - RN",
  "gross_weight": 6280.0,
  "tare_weight": 1080.0,
  "net_weight": 5200.0,
  "discount_type": "Percentage",
  "discount_value": 1.5,
  "discount_weight": 78.0,
  "payable_weight": 5122.0,
  "display_payable_weight": 5122.0,
  "rate_per_kg": 6.5,
  "total_amount": 33293.0,
  "purchase_invoice": null,
  "payment_status": null,
  "purchase_invoice_outstanding": null,
  "invoice_total": null,
  "invoice_paid_amount": null,
  "integration_status": "Not Integrated",
  "vehicle_no": "NOVA-TEST 1234",
  "driver_name": "NOVA TEST DRIVER",
  "weight_ticket": null,
  "supplier_receipt": null,
  "notes": "مسودة اختبار واجهة Nova",
  "docstatus": 0,
  "supplier_name": "NOVA-TEST Supplier",
  "item_name": "Cardboard Type A",
  "status": "Draft",
  "capabilities": {
    "can_edit": true,
    "can_submit": true,
    "can_cancel": false,
    "can_capture_gross": true,
    "can_capture_tare": true,
    "can_print": true
  }
}

export const SUPPLY_CAPS = {
  "name": "CS-2026-00009",
  "capabilities": {
    "can_edit": false,
    "can_submit": false,
    "can_cancel": false,
    "can_capture_gross": false,
    "can_capture_tare": false,
    "can_print": true
  }
}

export const SUPPLY_CREATE_CAPS = {
  "can_create": true,
  "can_submit": true
}

export const SUPPLY_PREVIEW = {
  "net_weight": 5200.0,
  "discount_weight": 78.0,
  "payable_weight": 5122.0,
  "display_payable_weight": 5122.0,
  "total_amount": 33293.0
}

export const SALES_LIST = {
  "data": [
    {
      "name": "SALE-2026-00001",
      "posting_date": "2026-09-14",
      "buyer_name": "NOVA-TEST Buyer",
      "item": "CARDBOARD-A",
      "quantity": 100.0,
      "rate_per_kg": 13.2,
      "total_amount": 1320.0,
      "docstatus": 0,
      "creation": "2026-09-14 13:34:59.284446",
      "item_name": "Cardboard Type A",
      "informational_value": 1320.0,
      "status": "Draft"
    }
  ],
  "page": 1,
  "page_size": 3,
  "total": 1,
  "has_more": false
}

export const SALES_DETAIL = {
  "name": "SALE-2026-00001",
  "posting_date": "2026-09-14",
  "buyer_name": "NOVA-TEST Buyer",
  "item": "CARDBOARD-A",
  "item_name": "Cardboard Type A",
  "quantity": 100.0,
  "rate_per_kg": 13.2,
  "total_amount": 1320.0,
  "informational_value": 1320.0,
  "status": "Draft",
  "docstatus": 0,
  "notes": "مسودة اختبار واجهة Nova",
  "company": "El Nos",
  "warehouse": "Main Warehouse - RN",
  "stock_entry": null,
  "capabilities": {
    "can_edit": true,
    "can_submit": true,
    "can_cancel": false
  }
}

export const SALES_BUYERS = {
  "data": [
    {
      "buyer_name": "NOVA-TEST Buyer"
    }
  ]
}

export const SALES_ITEMS = {
  "data": [
    {
      "name": "CARDBOARD-A",
      "item_name": "Cardboard Type A",
      "item_group": "Used Cardboard",
      "stock_uom": "Kg"
    }
  ]
}

export const SUPPLIER_LIST = {
  "data": [
    {
      "name": "_Test Supplier",
      "supplier_name": "_Test Supplier",
      "supplier_group": "_Test Supplier Group",
      "disabled": false
    },
    {
      "name": "_Test Supplier 1",
      "supplier_name": "_Test Supplier 1",
      "supplier_group": "_Test Supplier Group",
      "disabled": false
    },
    {
      "name": "_Test Supplier 2",
      "supplier_name": "_Test Supplier 2",
      "supplier_group": "_Test Supplier Group",
      "disabled": false
    },
    {
      "name": "_Test Supplier P",
      "supplier_name": "_Test Supplier P",
      "supplier_group": "_Test Supplier Group",
      "disabled": false
    },
    {
      "name": "_Test Supplier USD",
      "supplier_name": "_Test Supplier USD",
      "supplier_group": "_Test Supplier Group",
      "disabled": false
    }
  ],
  "page": 1,
  "page_size": 5,
  "total": 11,
  "has_more": true
}

export const SUPPLIER_DETAIL = {
  "name": "_Test Supplier",
  "supplier_name": "_Test Supplier",
  "supplier_group": "_Test Supplier Group",
  "disabled": false,
  "supplier_type": "Company",
  "mobile_no": "",
  "email_id": "",
  "primary_address": null,
  "tax_id": null,
  "supplier_details": null,
  "capabilities": {
    "can_read": true,
    "can_create": true,
    "can_edit": false
  }
}

export const SUPPLIER_SCHEMA = {
  "required_fields": [
    "supplier_name"
  ],
  "optional_fields": [
    "supplier_type",
    "tax_id",
    "supplier_details"
  ],
  "read_only_fields": [
    "name",
    "supplier_group",
    "disabled",
    "mobile_no",
    "email_id",
    "primary_address"
  ],
  "system_managed_fields": [
    "supplier_group",
    "accounts",
    "default_currency",
    "default_bank_account",
    "payment_terms",
    "company"
  ],
  "default_supplier_group": "Cardboard Suppliers",
  "supplier_type_default": "Company"
}

export const SUPPLIER_CAPS = {
  "name": "_Test Supplier",
  "capabilities": {
    "can_read": true,
    "can_create": true,
    "can_edit": false
  }
}

export const PAYMENT_LIST = {
  "data": [
    {
      "name": "CSP-2026-00005",
      "posting_date": "2026-09-14",
      "supplier": "UAT W01 Supplier 20260913",
      "amount": 1000.0,
      "mode_of_payment": "Cash",
      "docstatus": 0,
      "creation": "2026-09-14 13:35:23.886622",
      "supplier_name": "UAT W01 Supplier 20260913",
      "status": "Draft"
    },
    {
      "name": "CSP-2026-00004",
      "posting_date": "2026-09-14",
      "supplier": "محمد عيد",
      "amount": 15000.0,
      "mode_of_payment": "Cash",
      "docstatus": 0,
      "creation": "2026-09-14 13:04:53.088742",
      "supplier_name": "محمد عيد",
      "status": "Draft"
    },
    {
      "name": "CSP-2026-00003",
      "posting_date": "2026-09-14",
      "supplier": "محمد عيد",
      "amount": 10000.0,
      "mode_of_payment": "Cash",
      "docstatus": 0,
      "creation": "2026-09-14 04:16:26.649829",
      "supplier_name": "محمد عيد",
      "status": "Draft"
    }
  ],
  "page": 1,
  "page_size": 3,
  "total": 5,
  "has_more": true
}

export const PAYMENT_DETAIL = {
  "name": "CSP-2026-00004",
  "posting_date": "2026-09-14",
  "supplier": "محمد عيد",
  "supplier_name": "محمد عيد",
  "amount": 15000.0,
  "mode_of_payment": "Cash",
  "status": "Draft",
  "docstatus": 0,
  "reference_no": null,
  "reference_date": null,
  "notes": null,
  "payment_status": "Not Generated",
  "current_supplier_outstanding": 46800.0,
  "expected_remaining_outstanding": 31800.0,
  "capabilities": {
    "can_read": true,
    "can_edit": true,
    "can_submit": true,
    "can_cancel": false
  }
}

export const PAYMENT_SCHEMA = {
  "editable_fields": [
    "supplier",
    "amount",
    "mode_of_payment",
    "posting_date",
    "reference_no",
    "reference_date",
    "notes"
  ],
  "required_fields": [
    "supplier",
    "amount",
    "mode_of_payment",
    "posting_date"
  ],
  "optional_fields": [
    "reference_no",
    "reference_date",
    "notes"
  ],
  "server_owned_fields": [
    "company",
    "payment_entry",
    "payment_status",
    "current_supplier_outstanding",
    "expected_remaining_outstanding"
  ],
  "default_posting_date": "2026-09-14",
  "default_mode_of_payment": "Cash",
  "capabilities": {
    "can_create": true
  }
}

export const PAYMENT_CONTEXT = {
  "company": "El Nos",
  "current_supplier_outstanding": 46800.0
}

export const PAYMENT_SUPPLIERS = {
  "data": [
    {
      "supplier": "_Test Supplier",
      "supplier_name": "_Test Supplier",
      "disabled": false
    },
    {
      "supplier": "_Test Supplier 1",
      "supplier_name": "_Test Supplier 1",
      "disabled": false
    },
    {
      "supplier": "_Test Supplier 2",
      "supplier_name": "_Test Supplier 2",
      "disabled": false
    },
    {
      "supplier": "_Test Supplier P",
      "supplier_name": "_Test Supplier P",
      "disabled": false
    },
    {
      "supplier": "_Test Supplier USD",
      "supplier_name": "_Test Supplier USD",
      "disabled": false
    },
    {
      "supplier": "_Test Supplier with Country",
      "supplier_name": "_Test Supplier with Country",
      "disabled": false
    },
    {
      "supplier": "_Test Supplier With Tax Category",
      "supplier_name": "_Test Supplier With Tax Category",
      "disabled": false
    },
    {
      "supplier": "_Test Supplier With Template 1",
      "supplier_name": "_Test Supplier With Template 1",
      "disabled": false
    },
    {
      "supplier": "Test Supplier",
      "supplier_name": "Test Supplier",
      "disabled": false
    },
    {
      "supplier": "UAT W01 Supplier 20260913",
      "supplier_name": "UAT W01 Supplier 20260913",
      "disabled": false
    },
    {
      "supplier": "محمد عيد",
      "supplier_name": "محمد عيد",
      "disabled": false
    }
  ]
}

export const PAYMENT_MODES = {
  "data": [
    {
      "name": "Cash"
    }
  ]
}

export const EXPENSE_LIST = {
  "data": [
    {
      "name": "QE-2026-00001",
      "posting_date": "2026-09-14",
      "expense_category": "Administrative Expenses - RN",
      "expense_category_name": "Administrative Expenses",
      "amount": 250.0,
      "payment_source": "Cash - RN",
      "payment_source_name": "Cash",
      "payment_mode": "Cash",
      "status": "Draft",
      "docstatus": 0
    }
  ],
  "page": 1,
  "page_size": 3,
  "total": 1,
  "has_more": false
}

export const EXPENSE_DETAIL = {
  "name": "QE-2026-00001",
  "posting_date": "2026-09-14",
  "expense_category": "Administrative Expenses - RN",
  "expense_category_name": "Administrative Expenses",
  "amount": 250.0,
  "payment_source": "Cash - RN",
  "payment_source_name": "Cash",
  "payment_mode": "Cash",
  "status": "Draft",
  "docstatus": 0,
  "supplier_or_party": null,
  "description": "مسودة اختبار واجهة Nova",
  "attachment": null,
  "reference_no": null,
  "reference_date": null,
  "accounting_status": "Not Integrated",
  "capabilities": {
    "can_read": true,
    "can_edit": true,
    "can_submit": true,
    "can_cancel": false
  }
}

export const EXPENSE_SCHEMA = {
  "editable_fields": [
    "amount",
    "attachment",
    "description",
    "expense_category",
    "payment_mode",
    "payment_source",
    "posting_date",
    "reference_date",
    "reference_no",
    "supplier_or_party"
  ],
  "required_fields": [
    "posting_date",
    "expense_category",
    "amount",
    "payment_source"
  ],
  "optional_fields": [
    "payment_mode",
    "supplier_or_party",
    "description",
    "attachment",
    "reference_no",
    "reference_date"
  ],
  "server_owned_fields": [
    "company",
    "accounting_document",
    "accounting_status"
  ],
  "default_posting_date": "2026-09-14",
  "capabilities": {
    "can_create": true
  }
}

export const EXPENSE_CATEGORIES = {
  "data": [
    {
      "name": "Administrative Expenses - RN",
      "display_name": "Administrative Expenses"
    },
    {
      "name": "Commission on Sales - RN",
      "display_name": "Commission on Sales"
    },
    {
      "name": "Cost of Goods Sold - RN",
      "display_name": "Cost of Goods Sold"
    },
    {
      "name": "Depreciation - RN",
      "display_name": "Depreciation"
    },
    {
      "name": "Entertainment Expenses - RN",
      "display_name": "Entertainment Expenses"
    },
    {
      "name": "Exchange Gain/Loss - RN",
      "display_name": "Exchange Gain/Loss"
    },
    {
      "name": "Expenses Included In Asset Valuation - RN",
      "display_name": "Expenses Included In Asset Valuation"
    },
    {
      "name": "Expenses Included In Valuation - RN",
      "display_name": "Expenses Included In Valuation"
    },
    {
      "name": "Freight and Forwarding Charges - RN",
      "display_name": "Freight and Forwarding Charges"
    },
    {
      "name": "Gain/Loss on Asset Disposal - RN",
      "display_name": "Gain/Loss on Asset Disposal"
    },
    {
      "name": "Impairment - RN",
      "display_name": "Impairment"
    },
    {
      "name": "Legal Expenses - RN",
      "display_name": "Legal Expenses"
    },
    {
      "name": "Marketing Expenses - RN",
      "display_name": "Marketing Expenses"
    },
    {
      "name": "Miscellaneous Expenses - RN",
      "display_name": "Miscellaneous Expenses"
    },
    {
      "name": "Office Maintenance Expenses - RN",
      "display_name": "Office Maintenance Expenses"
    },
    {
      "name": "Office Rent - RN",
      "display_name": "Office Rent"
    },
    {
      "name": "Postal Expenses - RN",
      "display_name": "Postal Expenses"
    },
    {
      "name": "Print and Stationery - RN",
      "display_name": "Print and Stationery"
    },
    {
      "name": "Round Off - RN",
      "display_name": "Round Off"
    },
    {
      "name": "Salary - RN",
      "display_name": "Salary"
    },
    {
      "name": "Sales Expenses - RN",
      "display_name": "Sales Expenses"
    },
    {
      "name": "Stock Adjustment - RN",
      "display_name": "Stock Adjustment"
    },
    {
      "name": "Telephone Expenses - RN",
      "display_name": "Telephone Expenses"
    },
    {
      "name": "Travel Expenses - RN",
      "display_name": "Travel Expenses"
    },
    {
      "name": "Utility Expenses - RN",
      "display_name": "Utility Expenses"
    }
  ]
}

export const EXPENSE_SOURCES = {
  "data": [
    {
      "name": "Cash - RN",
      "display_name": "Cash"
    }
  ]
}

export const INVENTORY_OVERVIEW = {
  "state": "ok",
  "company": "El Nos",
  "warehouse": "Main Warehouse - RN",
  "warehouse_name": "Main Warehouse",
  "cardboard_item_group": "Used Cardboard",
  "item_groups": [
    "Used Cardboard"
  ],
  "currency": "EGP",
  "items": [
    {
      "name": "CARDBOARD-A",
      "item_name": "Cardboard Type A",
      "stock_uom": "Kg"
    }
  ],
  "selected_date": "2026-09-14",
  "is_today": true,
  "rows": [
    {
      "item_code": "CARDBOARD-A",
      "item_name": "Cardboard Type A",
      "stock_uom": "Kg",
      "quantity": 8500.0,
      "stock_value": 46900.0
    }
  ],
  "summary": {
    "quantity": 8500.0,
    "uom": "Kg",
    "stock_value": 46900.0
  },
  "activity": {
    "supplies": {
      "count": 1,
      "quantity": 100.0
    },
    "sales": {
      "count": 0,
      "quantity": 0.0
    },
    "net": 100.0
  }
}

export const REPORT_OPERATIONS = {
  "from_date": "2026-09-14",
  "to_date": "2026-09-14",
  "scope": {
    "company": "El Nos",
    "warehouse": "Main Warehouse - RN",
    "cardboard_item_group": "Used Cardboard",
    "cardboard_item": null
  },
  "supplies": {
    "count": 1,
    "quantity": 100.0,
    "payable_weight": 100.0,
    "value": 100.0
  },
  "sales": {
    "count": 0,
    "quantity": 0.0,
    "value": 0.0
  },
  "expenses": {
    "count": 0,
    "amount": 0.0
  },
  "supplier_payments": {
    "count": 0,
    "amount": 0.0
  },
  "inventory_movement": {
    "inbound_quantity": 100.0,
    "outbound_quantity": 0.0,
    "net_quantity": 100.0,
    "by_date": [
      {
        "date": "2026-09-14",
        "inbound": 100.0,
        "outbound": 0.0,
        "net": 100.0
      }
    ],
    "by_item": [
      {
        "item": "CARDBOARD-A",
        "item_name": "Cardboard Type A",
        "inbound": 100.0,
        "outbound": 0.0,
        "net": 100.0
      }
    ]
  }
}

export const REPORT_MOVEMENT = {
  "from_date": "2026-09-14",
  "to_date": "2026-09-14",
  "scope": {
    "company": "El Nos",
    "warehouse": "Main Warehouse - RN",
    "cardboard_item_group": "Used Cardboard",
    "cardboard_item": null
  },
  "inbound_quantity": 100.0,
  "outbound_quantity": 0.0,
  "net_quantity": 100.0,
  "by_date": [
    {
      "date": "2026-09-14",
      "inbound": 100.0,
      "outbound": 0.0,
      "net": 100.0
    }
  ],
  "by_item": [
    {
      "item": "CARDBOARD-A",
      "item_name": "Cardboard Type A",
      "inbound": 100.0,
      "outbound": 0.0,
      "net": 100.0
    }
  ]
}

export const REPORT_MOVEMENT_DATED = {
  "exception": "frappe.exceptions.ValidationError: To Date cannot be in the future",
  "exc_type": "ValidationError",
  "_exc_source": "cardboard_management (app)",
  "exc": "[\"Traceback (most recent call last):\\n  File \\\"apps/frappe/frappe/app.py\\\", line 157, in application\\n    response = frappe.api.handle(request)\\n               ^^^^^^^^^^^^^^^^^^^^^^^^^^\\n  File \\\"apps/frappe/frappe/api/__init__.py\\\", line 52, in handle\\n    data = endpoint(**arguments)\\n           ^^^^^^^^^^^^^^^^^^^^^\\n  File \\\"apps/frappe/frappe/api/v1.py\\\", line 40, in handle_rpc_call\\n    return frappe.handler.handle()\\n           ^^^^^^^^^^^^^^^^^^^^^^^\\n  File \\\"apps/frappe/frappe/handler.py\\\", line 53, in handle\\n    data = execute_cmd(cmd)\\n           ^^^^^^^^^^^^^^^^\\n  File \\\"apps/frappe/frappe/handler.py\\\", line 86, in execute_cmd\\n    return frappe.call(method, **frappe.form_dict)\\n           ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^\\n  File \\\"apps/frappe/frappe/__init__.py\\\", line 1772, in call\\n    return fn(*args, **newargs)\\n           ^^^^^^^^^^^^^^^^^^^^\\n  File \\\"apps/frappe/frappe/utils/typing_validations.py\\\", line 32, in wrapper\\n    return func(*args, **kwargs)\\n           ^^^^^^^^^^^^^^^^^^^^^\\n  File \\\"apps/cardboard_management/cardboard_management/reporting.py\\\", line 586, in get_inventory_movement\\n    filters = _context(\\n              ^^^^^^^^^\\n  File \\\"apps/cardboard_management/cardboard_management/reporting.py\\\", line 42, in _context\\n    start, end = _date_range(from_date, to_date)\\n                 ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^\\n  File \\\"apps/cardboard_management/cardboard_management/reporting.py\\\", line 28, in _date_range\\n    frappe.throw(_(\\\"To Date cannot be in the future\\\"))\\n  File \\\"apps/frappe/frappe/__init__.py\\\", line 621, in throw\\n    msgprint(\\n  File \\\"apps/frappe/frappe/__init__.py\\\", line 586, in msgprint\\n    _raise_exception()\\n  File \\\"apps/frappe/frappe/__init__.py\\\", line 537, in _raise_exception\\n    raise exc\\nfrappe.exceptions.ValidationError: To Date cannot be in the future\\n\"]",
  "_server_messages": "[\"{\\\"message\\\": \\\"To Date cannot be in the future\\\", \\\"title\\\": \\\"\\\\u0631\\\\u0633\\\\u0627\\\\u0644\\\\u0629\\\", \\\"indicator\\\": \\\"red\\\", \\\"raise_exception\\\": 1, \\\"__frappe_exc_id\\\": \\\"0631fbf0b91e5dc7feaadd6be87061adbd80e2f153b6527e3a1f4dae\\\"}\"]"
}

export const REPORT_EXPENSES = {
  "from_date": "2026-09-14",
  "to_date": "2026-09-14",
  "status": null,
  "scope": {
    "company": "El Nos",
    "warehouse": "Main Warehouse - RN",
    "cardboard_item_group": "Used Cardboard",
    "cardboard_item": null
  },
  "expense_count": 0,
  "total_expense_amount": 0.0,
  "by_account": []
}

export const REPORT_SUPPLIER_SUMMARY = {
  "supplier": {
    "name": "UAT W01 Supplier 20260913",
    "supplier_name": "UAT W01 Supplier 20260913",
    "supplier_group": "Cardboard Suppliers",
    "disabled": false
  },
  "from_date": "2026-09-14",
  "to_date": "2026-09-14",
  "scope": {
    "company": "El Nos",
    "warehouse": "Main Warehouse - RN",
    "cardboard_item_group": "Used Cardboard",
    "cardboard_item": null
  },
  "supply_count": 1,
  "supplied_payable_weight": 100.0,
  "supply_value": 100.0,
  "supplier_payments": 0.0,
  "outstanding": 100.0,
  "outstanding_semantics": "current_erpnext_purchase_invoice_outstanding",
  "supply_history": [
    {
      "supply": "CS-2026-00009",
      "posting_date": "2026-09-14",
      "item": "CARDBOARD-A",
      "item_name": "Cardboard Type A",
      "payable_weight": 100.0,
      "value": 100.0
    }
  ],
  "payment_history": []
}

export const REPORT_SUPPLIER_STATEMENT = {
  "supplier": {
    "name": "UAT W01 Supplier 20260913",
    "supplier_name": "UAT W01 Supplier 20260913",
    "supplier_group": "Cardboard Suppliers",
    "disabled": false
  },
  "from_date": "2026-09-14",
  "to_date": "2026-09-14",
  "scope": {
    "company": "El Nos",
    "warehouse": "Main Warehouse - RN",
    "cardboard_item_group": "Used Cardboard",
    "cardboard_item": null
  },
  "supply_count": 1,
  "supplied_payable_weight": 100.0,
  "supply_value": 100.0,
  "supplier_payments": 0.0,
  "outstanding": 100.0,
  "outstanding_semantics": "current_erpnext_purchase_invoice_outstanding",
  "supply_history": [
    {
      "supply": "CS-2026-00009",
      "posting_date": "2026-09-14",
      "item": "CARDBOARD-A",
      "item_name": "Cardboard Type A",
      "payable_weight": 100.0,
      "value": 100.0
    }
  ],
  "payment_history": [],
  "entries": [
    {
      "type": "supply",
      "posting_date": "2026-09-14",
      "name": "CS-2026-00009",
      "label": "Cardboard Type A",
      "quantity": 100.0,
      "amount": 100.0
    }
  ]
}

export const REPORT_NEW_SUPPLIER_SUMMARY = {
  "supplier": {
    "name": "NOVA-TEST Supplier",
    "supplier_name": "NOVA-TEST Supplier",
    "supplier_group": "Cardboard Suppliers",
    "disabled": false
  },
  "from_date": "2026-09-14",
  "to_date": "2026-09-14",
  "scope": {
    "company": "El Nos",
    "warehouse": "Main Warehouse - RN",
    "cardboard_item_group": "Used Cardboard",
    "cardboard_item": null
  },
  "supply_count": 0,
  "supplied_payable_weight": 0.0,
  "supply_value": 0.0,
  "supplier_payments": 0.0,
  "outstanding": 0.0,
  "outstanding_semantics": "current_erpnext_purchase_invoice_outstanding",
  "supply_history": [],
  "payment_history": []
}

export const REPORT_NEW_SUPPLIER_STATEMENT = {
  "supplier": {
    "name": "NOVA-TEST Supplier",
    "supplier_name": "NOVA-TEST Supplier",
    "supplier_group": "Cardboard Suppliers",
    "disabled": false
  },
  "from_date": "2026-09-14",
  "to_date": "2026-09-14",
  "scope": {
    "company": "El Nos",
    "warehouse": "Main Warehouse - RN",
    "cardboard_item_group": "Used Cardboard",
    "cardboard_item": null
  },
  "supply_count": 0,
  "supplied_payable_weight": 0.0,
  "supply_value": 0.0,
  "supplier_payments": 0.0,
  "outstanding": 0.0,
  "outstanding_semantics": "current_erpnext_purchase_invoice_outstanding",
  "supply_history": [],
  "payment_history": [],
  "entries": []
}

export const SETTINGS = {
  "company": "El Nos",
  "default_supplier_group": "Cardboard Suppliers",
  "default_mode_of_payment": "Cash",
  "cardboard_item_group": "Used Cardboard",
  "default_warehouse": "Main Warehouse - RN",
  "capabilities": {
    "can_read": true,
    "can_edit": true
  }
}

export const SETTINGS_COMPANIES = {
  "data": [
    {
      "name": "_Test Company",
      "display_name": "_Test Company"
    },
    {
      "name": "_Test Company 1",
      "display_name": "_Test Company 1"
    },
    {
      "name": "_Test Company 2",
      "display_name": "_Test Company 2"
    },
    {
      "name": "_Test Company 5",
      "display_name": "_Test Company 5"
    },
    {
      "name": "_Test Company with perpetual inventory",
      "display_name": "_Test Company with perpetual inventory"
    },
    {
      "name": "El Nos",
      "display_name": "El Nos"
    }
  ]
}

export const SETTINGS_ITEM_GROUPS = {
  "data": [
    {
      "name": "_Test Item Group",
      "display_name": "_Test Item Group"
    },
    {
      "name": "_Test Item Group A",
      "display_name": "_Test Item Group A"
    },
    {
      "name": "_Test Item Group B",
      "display_name": "_Test Item Group B"
    },
    {
      "name": "_Test Item Group B - 1",
      "display_name": "_Test Item Group B - 1"
    },
    {
      "name": "_Test Item Group B - 2",
      "display_name": "_Test Item Group B - 2"
    },
    {
      "name": "_Test Item Group B - 3",
      "display_name": "_Test Item Group B - 3"
    },
    {
      "name": "_Test Item Group C",
      "display_name": "_Test Item Group C"
    },
    {
      "name": "_Test Item Group C - 1",
      "display_name": "_Test Item Group C - 1"
    },
    {
      "name": "_Test Item Group C - 2",
      "display_name": "_Test Item Group C - 2"
    },
    {
      "name": "_Test Item Group D",
      "display_name": "_Test Item Group D"
    },
    {
      "name": "_Test Item Group Desktops",
      "display_name": "_Test Item Group Desktops"
    },
    {
      "name": "_Test Item Group Tax Child Override",
      "display_name": "_Test Item Group Tax Child Override"
    },
    {
      "name": "_Test Item Group Tax Parent",
      "display_name": "_Test Item Group Tax Parent"
    },
    {
      "name": "All Item Groups",
      "display_name": "All Item Groups"
    },
    {
      "name": "Consumable",
      "display_name": "Consumable"
    },
    {
      "name": "Products",
      "display_name": "Products"
    },
    {
      "name": "Raw Material",
      "display_name": "Raw Material"
    },
    {
      "name": "Services",
      "display_name": "Services"
    },
    {
      "name": "Sub Assemblies",
      "display_name": "Sub Assemblies"
    },
    {
      "name": "Used Cardboard",
      "display_name": "Used Cardboard"
    }
  ]
}

export const SETTINGS_WAREHOUSES = {
  "data": [
    {
      "name": "Finished Goods - RN",
      "display_name": "Finished Goods - RN"
    },
    {
      "name": "Goods In Transit - RN",
      "display_name": "Goods In Transit - RN"
    },
    {
      "name": "Main Warehouse - RN",
      "display_name": "Main Warehouse - RN"
    },
    {
      "name": "Stores - RN",
      "display_name": "Stores - RN"
    },
    {
      "name": "Work In Progress - RN",
      "display_name": "Work In Progress - RN"
    }
  ]
}
