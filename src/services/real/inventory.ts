import type { InventoryOverview, InventoryOverviewRequest, InventoryService } from '@/services/contracts'
import type { RpcTransport } from '@/services/api/frappe-rpc'

interface RawInventoryOverview {
  state: InventoryOverview['state']
  selected_date: string
  is_today: boolean
  currency: string
  warehouse_name: string
  rows?: Array<{ item_code: string; item_name: string; stock_uom: string; quantity: number; stock_value: number }>
  summary?: { quantity: number | null; uom: string | null; stock_value: number }
}

export function mapInventoryOverview(raw: RawInventoryOverview): InventoryOverview {
  return {
    state: raw.state,
    selectedDate: raw.selected_date,
    isToday: raw.is_today,
    currency: raw.currency,
    warehouseName: raw.warehouse_name,
    rows: (raw.rows ?? []).map((row) => ({
      itemCode: row.item_code,
      itemName: row.item_name,
      stockUom: row.stock_uom,
      quantity: row.quantity,
      stockValue: row.stock_value,
    })),
    summary: {
      quantity: raw.summary?.quantity ?? null,
      uom: raw.summary?.uom ?? null,
      stockValue: raw.summary?.stock_value ?? 0,
    },
  }
}

export function createInventoryService(transport: RpcTransport): InventoryService {
  return {
    async getOverview(request: InventoryOverviewRequest) {
      return mapInventoryOverview(
        await transport.call<RawInventoryOverview>('cardboard_management.inventory.get_inventory_overview', {
          item_code: request.itemCode,
          selected_date: request.selectedDate,
        }),
      )
    },
  }
}
