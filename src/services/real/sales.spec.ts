import { describe, expect, it } from 'vitest'

import { SALES_BUYERS, SALES_CREATE_CAPS, SALES_DETAIL, SALES_ITEMS, SALES_LIST } from './__fixtures__/observed'
import { createRecordingTransport } from './__fixtures__/rpc'
import { createSalesService } from './sales'

const API = 'cardboard_management.cardboard_management.api.sales'

describe('sales service against captured live payloads', () => {
  it('posts the paged list query to the app-owned path', async () => {
    const { rpc, calls } = createRecordingTransport(SALES_LIST)
    const page = await createSalesService(rpc).list({ status: 'Draft', pageSize: 5 })

    expect(calls[0].method).toBe(`${API}.list_sales`)
    expect(calls[0].args).toMatchObject({ status: 'Draft', page_size: 5 })
    expect(page.total).toBe(SALES_LIST.total)
    expect(page.data).toHaveLength(SALES_LIST.data.length)
  })

  it('reads every list field the backend actually sends', async () => {
    const { rpc } = createRecordingTransport(SALES_LIST)
    const [row] = (await createSalesService(rpc).list()).data
    const raw = SALES_LIST.data[0]

    expect(row.name).toBe(raw.name)
    expect(row.postingDate).toBe(raw.posting_date)
    expect(row.buyerName).toBe(raw.buyer_name)
    expect(row.item).toBe(raw.item)
    expect(row.itemName).toBe(raw.item_name)
    expect(row.quantity).toBe(raw.quantity)
    expect(row.ratePerKg).toBe(raw.rate_per_kg)
    expect(row.totalAmount).toBe(raw.total_amount)
    expect(row.informationalValue).toBe(raw.informational_value)
    expect(row.status).toBe(raw.status)
    expect(row.docstatus).toBe(raw.docstatus)
  })

  it('maps the detail warehouse/company and capability flags', async () => {
    const { rpc, calls } = createRecordingTransport(SALES_DETAIL)
    const detail = await createSalesService(rpc).get('SALE-2026-00001')

    expect(calls[0].method).toBe(`${API}.get_sale`)
    expect(detail.company).toBe(SALES_DETAIL.company)
    expect(detail.warehouse).toBe(SALES_DETAIL.warehouse)
    expect(detail.capabilities.canSubmit).toBe(SALES_DETAIL.capabilities.can_submit)
    expect(detail.capabilities.canCancel).toBe(SALES_DETAIL.capabilities.can_cancel)
  })

  it('flattens the buyer suggestions from the lookup envelope', async () => {
    const { rpc, calls } = createRecordingTransport(SALES_BUYERS)
    const buyers = await createSalesService(rpc).lookupBuyers('NOVA')

    expect(calls[0].method).toBe(`${API}.lookup_buyers`)
    expect(calls[0].args).toMatchObject({ search: 'NOVA' })
    expect(buyers).toEqual(SALES_BUYERS.data.map((row) => row.buyer_name))
  })

  it('normalises the item lookup into name/label options', async () => {
    const { rpc } = createRecordingTransport(SALES_ITEMS)
    const items = await createSalesService(rpc).lookupItems()

    expect(items).toEqual(SALES_ITEMS.data.map((row) => ({ name: row.name, label: row.item_name })))
  })

  it('reads the create capability the server grants for a new sale', async () => {
    const { rpc, calls } = createRecordingTransport(SALES_CREATE_CAPS)
    const caps = await createSalesService(rpc).getCreateCapabilities()

    expect(calls[0].method).toBe(`${API}.get_create_capabilities`)
    expect(caps.canCreate).toBe(SALES_CREATE_CAPS.can_create)
    expect(caps.canSubmit).toBe(SALES_CREATE_CAPS.can_submit)
  })
})
