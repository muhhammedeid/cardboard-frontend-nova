import { describe, expect, it } from 'vitest'

import { SUPPLY_CREATE_CAPS, SUPPLY_DETAIL, SUPPLY_DRAFT_DETAIL, SUPPLY_LIST, SUPPLY_PREVIEW } from './__fixtures__/observed'
import { createRecordingTransport } from './__fixtures__/rpc'
import { createSupplyService } from './supply'

const API = 'cardboard_management.cardboard_management.api.supply'

describe('supply service against captured live payloads', () => {
  it('posts the paged list query to the app-owned path', async () => {
    const { rpc, calls } = createRecordingTransport(SUPPLY_LIST)
    const page = await createSupplyService(rpc).list({ page: 2, pageSize: 10, search: 'CS' })

    expect(calls).toHaveLength(1)
    expect(calls[0].method).toBe(`${API}.list_supplies`)
    expect(calls[0].args).toMatchObject({ page: 2, page_size: 10, search: 'CS' })
    expect(page.page).toBe(SUPPLY_LIST.page)
    expect(page.total).toBe(SUPPLY_LIST.total)
    expect(page.hasMore).toBe(SUPPLY_LIST.has_more)
    expect(page.data).toHaveLength(SUPPLY_LIST.data.length)
  })

  it('reads every list field the backend actually sends', async () => {
    const { rpc } = createRecordingTransport(SUPPLY_LIST)
    const [row] = (await createSupplyService(rpc).list()).data
    const raw = SUPPLY_LIST.data[0]

    expect(row.name).toBe(raw.name)
    expect(row.postingDate).toBe(raw.posting_date)
    expect(row.supplier).toBe(raw.supplier)
    expect(row.supplierName).toBe(raw.supplier_name)
    expect(row.item).toBe(raw.item)
    expect(row.itemName).toBe(raw.item_name)
    expect(row.payableWeight).toBe(raw.payable_weight)
    expect(row.totalAmount).toBe(raw.total_amount)
    expect(row.status).toBe(raw.status)
    expect(row.docstatus).toBe(raw.docstatus)
  })

  it('reads the accounting detail fields (including the purchase invoice)', async () => {
    const { rpc, calls } = createRecordingTransport(SUPPLY_DETAIL)
    const detail = await createSupplyService(rpc).get('CS-2026-00009')

    expect(calls[0].method).toBe(`${API}.get_supply`)
    expect(calls[0].args).toMatchObject({ name: 'CS-2026-00009' })
    expect(detail.purchaseInvoice).toBe(SUPPLY_DETAIL.purchase_invoice)
    expect(detail.invoiceTotal).toBe(SUPPLY_DETAIL.invoice_total)
    expect(detail.invoicePaidAmount).toBe(SUPPLY_DETAIL.invoice_paid_amount)
    expect(detail.purchaseInvoiceOutstanding).toBe(SUPPLY_DETAIL.purchase_invoice_outstanding)
    expect(detail.integrationStatus).toBe(SUPPLY_DETAIL.integration_status)
    expect(detail.payableWeight).toBe(SUPPLY_DETAIL.payable_weight)
  })

  it('carries the per-document capability flags it was granted', async () => {
    const { rpc } = createRecordingTransport(SUPPLY_DETAIL)
    const detail = await createSupplyService(rpc).get('CS-2026-00009')

    expect(detail.capabilities.canEdit).toBe(SUPPLY_DETAIL.capabilities.can_edit)
    expect(detail.capabilities.canSubmit).toBe(SUPPLY_DETAIL.capabilities.can_submit)
    expect(detail.capabilities.canCancel).toBe(SUPPLY_DETAIL.capabilities.can_cancel)
  })

  it('keeps a draft detail readable without claiming un-granted rights', async () => {
    const { rpc } = createRecordingTransport(SUPPLY_DRAFT_DETAIL)
    const detail = await createSupplyService(rpc).get(SUPPLY_DRAFT_DETAIL.name)

    expect(detail.name).toBe(SUPPLY_DRAFT_DETAIL.name)
    expect(detail.status).toBe(SUPPLY_DRAFT_DETAIL.status)
    expect(detail.docstatus).toBe(SUPPLY_DRAFT_DETAIL.docstatus)
  })

  it('never assumes a create capability the server did not grant', async () => {
    const { rpc, calls } = createRecordingTransport(SUPPLY_CREATE_CAPS)
    const caps = await createSupplyService(rpc).getCreateCapabilities()

    expect(calls[0].method).toBe(`${API}.get_create_capabilities`)
    expect(caps.canCreate).toBe(SUPPLY_CREATE_CAPS.can_create)
  })

  it('mirrors the preview weights the backend computed', async () => {
    const { rpc, calls } = createRecordingTransport(SUPPLY_PREVIEW)
    const preview = await createSupplyService(rpc).preview({
      postingDate: '2026-09-14',
      supplier: 'UAT W01 Supplier 20260913',
      item: 'CARDBOARD-A',
      grossWeight: 6280,
      tareWeight: 1080,
      ratePerKg: 6.5,
      discountType: 'Percentage',
      discountValue: 1.5,
    })

    expect(calls[0].method).toBe(`${API}.preview_supply`)
    expect(calls[0].args).toMatchObject({ gross_weight: 6280, tare_weight: 1080, rate_per_kg: 6.5 })
    expect(preview.payableWeight).toBe(SUPPLY_PREVIEW.payable_weight)
    expect(preview.totalAmount).toBe(SUPPLY_PREVIEW.total_amount)
  })
})
