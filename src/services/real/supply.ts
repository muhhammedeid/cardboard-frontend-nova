import type { RpcTransport } from '@/services/api/frappe-rpc'
import type { Lookup, SupplyDetail, SupplyInput, SupplyListQuery, SupplyPage, SupplyPreview, SupplyService } from '@/services/contracts'

/** App-owned Frappe RPC paths (double app-package prefix is intentional). */
const API = 'cardboard_management.cardboard_management.api.supply'

interface RawSupply {
  name: string
  posting_date: string
  supplier: string
  supplier_name: string
  item: string
  item_name: string
  payable_weight: number
  total_amount: number
  status: SupplyDetail['status']
  docstatus: 0 | 1 | 2
  warehouse?: string
  gross_weight?: number
  tare_weight?: number
  net_weight?: number
  discount_type?: SupplyDetail['discountType']
  discount_value?: number
  discount_weight?: number
  display_payable_weight?: number
  rate_per_kg?: number
  payment_status?: string
  purchase_invoice_outstanding?: number
  invoice_total?: number
  invoice_paid_amount?: number
  integration_status?: string
  vehicle_no?: string
  driver_name?: string
  weight_ticket?: string
  supplier_receipt?: string
  notes?: string
  capabilities?: {
    can_edit: boolean
    can_submit: boolean
    can_cancel: boolean
    can_capture_gross: boolean
    can_capture_tare: boolean
    can_print: boolean
  }
}

interface RawPage {
  data: RawSupply[]
  page: number
  page_size: number
  total: number
  has_more: boolean
}

const NO_CAPABILITIES: SupplyDetail['capabilities'] = {
  canEdit: false,
  canSubmit: false,
  canCancel: false,
  canCaptureGross: false,
  canCaptureTare: false,
  canPrint: false,
}

const listItem = (raw: RawSupply): SupplyDetail => ({
  name: raw.name,
  postingDate: raw.posting_date,
  supplier: raw.supplier,
  supplierName: raw.supplier_name,
  item: raw.item,
  itemName: raw.item_name,
  payableWeight: raw.payable_weight,
  totalAmount: raw.total_amount,
  status: raw.status,
  docstatus: raw.docstatus,
  warehouse: raw.warehouse ?? '',
  grossWeight: raw.gross_weight ?? 0,
  tareWeight: raw.tare_weight ?? 0,
  netWeight: raw.net_weight ?? 0,
  discountType: raw.discount_type ?? 'No Discount',
  discountValue: raw.discount_value ?? 0,
  discountWeight: raw.discount_weight ?? 0,
  displayPayableWeight: raw.display_payable_weight ?? raw.payable_weight,
  ratePerKg: raw.rate_per_kg ?? 0,
  paymentStatus: raw.payment_status,
  purchaseInvoiceOutstanding: raw.purchase_invoice_outstanding,
  invoiceTotal: raw.invoice_total,
  invoicePaidAmount: raw.invoice_paid_amount,
  integrationStatus: raw.integration_status,
  vehicleNo: raw.vehicle_no,
  driverName: raw.driver_name,
  weightTicket: raw.weight_ticket,
  supplierReceipt: raw.supplier_receipt,
  notes: raw.notes,
  capabilities: raw.capabilities
    ? {
        canEdit: raw.capabilities.can_edit,
        canSubmit: raw.capabilities.can_submit,
        canCancel: raw.capabilities.can_cancel,
        canCaptureGross: raw.capabilities.can_capture_gross,
        canCaptureTare: raw.capabilities.can_capture_tare,
        canPrint: raw.capabilities.can_print,
      }
    : NO_CAPABILITIES,
})

const editableFields = (input: SupplyInput) => ({
  posting_date: input.postingDate,
  supplier: input.supplier,
  item: input.item,
  gross_weight: input.grossWeight,
  tare_weight: input.tareWeight,
  rate_per_kg: input.ratePerKg,
  discount_type: input.discountType,
  discount_value: input.discountValue,
  vehicle_no: input.vehicleNo,
  driver_name: input.driverName,
  weight_ticket: input.weightTicket,
  supplier_receipt: input.supplierReceipt,
  notes: input.notes,
})

export function createSupplyService(transport: RpcTransport): SupplyService {
  return {
    async list(query: SupplyListQuery = {}) {
      const raw = await transport.call<RawPage>(`${API}.list_supplies`, {
        date_from: query.dateFrom,
        date_to: query.dateTo,
        supplier: query.supplier,
        item: query.item,
        status: query.status,
        search: query.search,
        page: query.page,
        page_size: query.pageSize,
      })
      return { data: raw.data.map(listItem), page: raw.page, pageSize: raw.page_size, total: raw.total, hasMore: raw.has_more } satisfies SupplyPage
    },
    async get(name) {
      return listItem(await transport.call<RawSupply>(`${API}.get_supply`, { name }))
    },
    async lookupSuppliers(search) {
      const raw = await transport.call<{ data: Array<{ name: string; supplier_name?: string }> }>(`${API}.lookup_suppliers`, { search })
      return raw.data.map((row): Lookup => ({ name: row.name, label: row.supplier_name ?? row.name }))
    },
    async lookupItems(search) {
      const raw = await transport.call<{ data: Array<{ name: string; item_name?: string }> }>(`${API}.lookup_items`, { search })
      return raw.data.map((row): Lookup => ({ name: row.name, label: row.item_name ?? row.name }))
    },
    async getCreateCapabilities() {
      const raw = await transport.call<{ can_create: boolean; can_submit: boolean }>(`${API}.get_create_capabilities`)
      return { canCreate: raw.can_create, canSubmit: raw.can_submit }
    },
    async preview(input) {
      const raw = await transport.call<{
        net_weight: number
        discount_weight: number
        payable_weight: number
        display_payable_weight: number
        total_amount: number
      }>(`${API}.preview_supply`, editableFields(input))
      return {
        netWeight: raw.net_weight,
        discountWeight: raw.discount_weight,
        payableWeight: raw.payable_weight,
        displayPayableWeight: raw.display_payable_weight,
        totalAmount: raw.total_amount,
      } satisfies SupplyPreview
    },
    async create(input) {
      return listItem(await transport.call<RawSupply>(`${API}.create_supply`, editableFields(input)))
    },
    async update(name, input) {
      return listItem(await transport.call<RawSupply>(`${API}.update_supply`, { name, ...editableFields(input) }))
    },
    async submit(name) {
      return listItem(await transport.call<RawSupply>(`${API}.submit_supply`, { name }))
    },
    async cancel(name) {
      return listItem(await transport.call<RawSupply>(`${API}.cancel_supply`, { name }))
    },
    async capture(name, field, weight) {
      const raw = await transport.call<{ supply: RawSupply }>(`${API}.capture_${field}_weight`, { name, weight })
      return listItem(raw.supply)
    },
    async print(name) {
      return transport.call<{ url: string; format: string }>(`${API}.get_print_action`, { name })
    },
  }
}
