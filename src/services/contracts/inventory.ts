export interface InventoryOverviewRequest {
  itemCode?: string
  selectedDate?: string
}

export type InventoryState = 'ok' | 'no_items' | 'no_stock'

export interface InventoryRow {
  itemCode: string
  itemName: string
  stockUom: string
  quantity: number
  stockValue: number
}

export interface InventoryOverview {
  state: InventoryState
  selectedDate: string
  isToday: boolean
  currency: string
  warehouseName: string
  rows: InventoryRow[]
  summary: { quantity: number | null; uom: string | null; stockValue: number }
}

export interface InventoryService {
  getOverview(request: InventoryOverviewRequest): Promise<InventoryOverview>
}
