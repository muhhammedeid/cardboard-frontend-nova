import { describe, expect, it } from 'vitest'

import { INVENTORY_OVERVIEW } from './__fixtures__/observed'
import { createRecordingTransport } from './__fixtures__/rpc'
import { createInventoryService } from './inventory'

describe('inventory service against the captured live payload', () => {
  it('calls the app-owned inventory method and keeps the snapshot semantics', async () => {
    const { rpc, calls } = createRecordingTransport(INVENTORY_OVERVIEW)
    const overview = await createInventoryService(rpc).getOverview({ selectedDate: '2026-09-14' })

    expect(calls[0].method).toBe('cardboard_management.inventory.get_inventory_overview')
    expect(overview.state).toBe(INVENTORY_OVERVIEW.state)
    expect(overview.selectedDate).toBe(INVENTORY_OVERVIEW.selected_date)
    expect(overview.isToday).toBe(INVENTORY_OVERVIEW.is_today)
    expect(overview.currency).toBe(INVENTORY_OVERVIEW.currency)
    expect(overview.warehouseName).toBe(INVENTORY_OVERVIEW.warehouse_name)
  })

  it('reads every row field the backend actually sends', async () => {
    const { rpc } = createRecordingTransport(INVENTORY_OVERVIEW)
    const overview = await createInventoryService(rpc).getOverview({})

    expect(overview.rows).toHaveLength(INVENTORY_OVERVIEW.rows.length)
    for (const [index, row] of overview.rows.entries()) {
      const raw = INVENTORY_OVERVIEW.rows[index]
      expect(row.itemCode).toBe(raw.item_code)
      expect(row.itemName).toBe(raw.item_name)
      expect(row.stockUom).toBe(raw.stock_uom)
      expect(row.quantity).toBe(raw.quantity)
      expect(row.stockValue).toBe(raw.stock_value)
    }
  })

  it('keeps the numeric summary identical to the server total', async () => {
    const { rpc } = createRecordingTransport(INVENTORY_OVERVIEW)
    const overview = await createInventoryService(rpc).getOverview({})

    expect(overview.summary.stockValue).toBe(INVENTORY_OVERVIEW.summary.stock_value)
    expect(overview.summary.quantity).toBe(INVENTORY_OVERVIEW.summary.quantity)
    expect(overview.summary.uom).toBe(INVENTORY_OVERVIEW.summary.uom)
  })
})
