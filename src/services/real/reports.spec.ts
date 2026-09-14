import { describe, expect, it } from 'vitest'

import {
  REPORT_EXPENSES,
  REPORT_MOVEMENT,
  REPORT_NEW_SUPPLIER_SUMMARY,
  REPORT_OPERATIONS,
  REPORT_SUPPLIER_STATEMENT,
  REPORT_SUPPLIER_SUMMARY,
} from './__fixtures__/observed'
import { createRecordingTransport } from './__fixtures__/rpc'
import { createReportService } from './reports'

const REPORTING = 'cardboard_management.reporting'

describe('report service against captured live payloads', () => {
  it('summarises operations with the server totals', async () => {
    const { rpc, calls } = createRecordingTransport(REPORT_OPERATIONS)
    const report = await createReportService(rpc).operations({ fromDate: '2026-09-01', toDate: '2026-09-14' })

    expect(calls[0].method).toBe(`${REPORTING}.get_operations_summary`)
    expect(calls[0].args).toMatchObject({ from_date: '2026-09-01', to_date: '2026-09-14' })
    expect(report.supplies.count).toBe(REPORT_OPERATIONS.supplies.count)
    expect(report.supplies.payableWeight).toBe(REPORT_OPERATIONS.supplies.payable_weight)
    expect(report.supplies.value).toBe(REPORT_OPERATIONS.supplies.value)
    expect(report.sales.informationalValue).toBe(REPORT_OPERATIONS.sales.value)
    expect(report.expenses.amount).toBe(REPORT_OPERATIONS.expenses.amount)
  })

  it('reads the movement report rows and totals', async () => {
    const { rpc, calls } = createRecordingTransport(REPORT_MOVEMENT)
    const report = await createReportService(rpc).movement({ fromDate: '2026-09-01', toDate: '2026-09-14' })

    expect(calls[0].method).toBe(`${REPORTING}.get_inventory_movement`)
    expect(report.fromDate).toBe(REPORT_MOVEMENT.from_date)
    // Totals are suffixed on the wire (`inbound_quantity`), rows are not (`inbound`).
    expect(report.inbound).toBe(REPORT_MOVEMENT.inbound_quantity)
    expect(report.outbound).toBe(REPORT_MOVEMENT.outbound_quantity)
    expect(report.net).toBe(REPORT_MOVEMENT.net_quantity)
    expect(report.byItem).toHaveLength(REPORT_MOVEMENT.by_item.length)
    expect(report.byDate).toHaveLength(REPORT_MOVEMENT.by_date.length)
    expect(report.byItem[0]?.inbound).toBe(REPORT_MOVEMENT.by_item[0].inbound)
    expect(report.byDate[0]?.net).toBe(REPORT_MOVEMENT.by_date[0].net)
  })

  it('reads the expense summary per category', async () => {
    const { rpc, calls } = createRecordingTransport(REPORT_EXPENSES)
    const report = await createReportService(rpc).expenses({})

    expect(calls[0].method).toBe(`${REPORTING}.get_expense_summary`)
    expect(report.totalAmount).toBe(REPORT_EXPENSES.total_expense_amount)
    expect(report.count).toBe(REPORT_EXPENSES.expense_count)
    expect(report.categories).toHaveLength(REPORT_EXPENSES.by_account.length)
  })

  it('reads the supplier summary headline numbers', async () => {
    const { rpc, calls } = createRecordingTransport(REPORT_SUPPLIER_SUMMARY)
    const report = await createReportService(rpc).supplierSummary({ supplier: REPORT_SUPPLIER_SUMMARY.supplier.name })

    expect(calls[0].method).toBe(`${REPORTING}.get_supplier_summary`)
    expect(calls[0].args).toMatchObject({ supplier: REPORT_SUPPLIER_SUMMARY.supplier.name })
    expect(report.supplier.nameLabel).toBe(REPORT_SUPPLIER_SUMMARY.supplier.supplier_name)
    expect(report.supplyCount).toBe(REPORT_SUPPLIER_SUMMARY.supply_count)
    expect(report.suppliedPayableWeight).toBe(REPORT_SUPPLIER_SUMMARY.supplied_payable_weight)
    expect(report.paidAmount).toBe(REPORT_SUPPLIER_SUMMARY.supplier_payments)
    expect(report.currentOutstanding).toBe(REPORT_SUPPLIER_SUMMARY.outstanding)
  })

  it('reads every statement entry the backend returned', async () => {
    const { rpc, calls } = createRecordingTransport(REPORT_SUPPLIER_STATEMENT)
    const report = await createReportService(rpc).supplierStatement({ supplier: REPORT_SUPPLIER_STATEMENT.supplier.name })

    expect(calls[0].method).toBe(`${REPORTING}.get_supplier_statement`)
    expect(report.entries).toHaveLength(REPORT_SUPPLIER_STATEMENT.entries.length)
    for (const [index, entry] of report.entries.entries()) {
      const raw = REPORT_SUPPLIER_STATEMENT.entries[index]
      expect(entry.type).toBe(raw.type)
      expect(entry.name).toBe(raw.name)
      expect(entry.postingDate).toBe(raw.posting_date)
      expect(entry.label).toBe(raw.label)
      expect(entry.amount).toBe(raw.amount)
    }
  })

  it('reports zero history for a supplier whose only supply is still a draft', async () => {
    const { rpc } = createRecordingTransport(REPORT_NEW_SUPPLIER_SUMMARY)
    const report = await createReportService(rpc).supplierSummary({ supplier: REPORT_NEW_SUPPLIER_SUMMARY.supplier.name })

    // Documented backend semantics: the supplier summary counts submitted
    // documents only, so a draft is invisible here.
    expect(report.supplyCount).toBe(0)
    expect(report.supplyCount).toBe(REPORT_NEW_SUPPLIER_SUMMARY.supply_count)
  })
})
