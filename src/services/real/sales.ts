import type { RpcTransport } from '@/services/api/frappe-rpc'
import type { SaleDetail, SaleInput, SaleListItem, SaleListQuery, SaleLookup, SalePage, SalesService } from '@/services/contracts'

const API = 'cardboard_management.cardboard_management.api.sales'

interface RawSale {
  name: string
  posting_date: string
  buyer_name?: string
  item: string
  item_name: string
  quantity: number
  rate_per_kg: number
  total_amount: number
  informational_value: number
  status: SaleListItem['status']
  docstatus: 0 | 1 | 2
  notes?: string
  company?: string
  warehouse?: string
  stock_entry?: string
  capabilities?: { can_edit: boolean; can_submit: boolean; can_cancel: boolean }
}

const mapSale = (raw: RawSale): SaleDetail => ({
  name: raw.name,
  postingDate: raw.posting_date,
  buyerName: raw.buyer_name,
  item: raw.item,
  itemName: raw.item_name,
  quantity: raw.quantity,
  ratePerKg: raw.rate_per_kg,
  totalAmount: raw.total_amount,
  informationalValue: raw.informational_value,
  status: raw.status,
  docstatus: raw.docstatus,
  notes: raw.notes,
  company: raw.company ?? '',
  warehouse: raw.warehouse ?? '',
  stockEntry: raw.stock_entry,
  capabilities: {
    canEdit: Boolean(raw.capabilities?.can_edit),
    canSubmit: Boolean(raw.capabilities?.can_submit),
    canCancel: Boolean(raw.capabilities?.can_cancel),
  },
})

const editableFields = (input: SaleInput) => ({
  posting_date: input.postingDate,
  item: input.item,
  quantity: input.quantity,
  rate_per_kg: input.ratePerKg,
  buyer_name: input.buyerName,
  notes: input.notes,
})

export function createSalesService(transport: RpcTransport): SalesService {
  return {
    async list(query: SaleListQuery = {}) {
      const raw = await transport.call<{ data: RawSale[]; page: number; page_size: number; total: number; has_more: boolean }>(
        `${API}.list_sales`,
        {
          from_date: query.fromDate,
          to_date: query.toDate,
          item: query.item,
          buyer: query.buyer,
          status: query.status,
          search: query.search,
          page: query.page,
          page_size: query.pageSize,
        },
      )
      return {
        data: raw.data.map(mapSale),
        page: raw.page,
        pageSize: raw.page_size,
        total: raw.total,
        hasMore: raw.has_more,
      } satisfies SalePage
    },
    async get(name) {
      return mapSale(await transport.call<RawSale>(`${API}.get_sale`, { name }))
    },
    async lookupBuyers(search) {
      const raw = await transport.call<{ data: Array<{ buyer_name: string }> }>(`${API}.lookup_buyers`, { search })
      return raw.data.map((row) => row.buyer_name)
    },
    async lookupItems(search) {
      const raw = await transport.call<{ data: Array<{ name: string; item_name: string }> }>(`${API}.lookup_items`, { search })
      return raw.data.map((row): SaleLookup => ({ name: row.name, label: row.item_name }))
    },
    async create(input) {
      return mapSale(await transport.call<RawSale>(`${API}.create_sale`, editableFields(input)))
    },
    async update(name, input) {
      return mapSale(await transport.call<RawSale>(`${API}.update_sale`, { name, ...editableFields(input) }))
    },
    async submit(name) {
      return mapSale(await transport.call<RawSale>(`${API}.submit_sale`, { name }))
    },
    async cancel(name) {
      return mapSale(await transport.call<RawSale>(`${API}.cancel_sale`, { name }))
    },
    async getCapabilities(name) {
      const raw = await transport.call<{ capabilities: { can_edit: boolean; can_submit: boolean; can_cancel: boolean } }>(
        `${API}.get_capabilities`,
        { name },
      )
      return { canEdit: raw.capabilities.can_edit, canSubmit: raw.capabilities.can_submit, canCancel: raw.capabilities.can_cancel }
    },
    async formAction(name) {
      const raw = await transport.call<{ url: string; desk_route: string; query: string }>(`${API}.get_form_action`, { name })
      return { url: raw.url, deskRoute: raw.desk_route, query: raw.query }
    },
  }
}
