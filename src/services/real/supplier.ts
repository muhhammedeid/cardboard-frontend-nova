import type { RpcTransport } from '@/services/api/frappe-rpc'
import type { SupplierDetail, SupplierListItem, SupplierPage, SupplierSchema, SupplierService, SupplierSummary, SupplierType } from '@/services/contracts'

const API = 'cardboard_management.cardboard_management.api.suppliers'

interface RawSupplier {
  name: string
  supplier_name: string
  supplier_group?: string
  disabled: boolean
  supplier_type?: SupplierType
  mobile_no?: string
  email_id?: string
  primary_address?: string
  tax_id?: string
  supplier_details?: string
  capabilities?: { can_read: boolean; can_create: boolean; can_edit: false }
}

export const mapSupplierListItem = (raw: RawSupplier): SupplierListItem => ({
  name: raw.name,
  supplierName: raw.supplier_name,
  supplierGroup: raw.supplier_group,
  disabled: Boolean(raw.disabled),
})

export const mapSupplierDetail = (raw: RawSupplier): SupplierDetail => ({
  ...mapSupplierListItem(raw),
  supplierType: raw.supplier_type ?? 'Company',
  mobileNo: raw.mobile_no,
  emailId: raw.email_id,
  primaryAddress: raw.primary_address,
  taxId: raw.tax_id,
  supplierDetails: raw.supplier_details,
  capabilities: {
    canRead: Boolean(raw.capabilities?.can_read),
    canCreate: Boolean(raw.capabilities?.can_create),
    canEdit: false,
  },
})

interface RawSummary {
  supplier: RawSupplier
  from_date: string
  to_date: string
  supply_count: number
  supplied_payable_weight: number
  supply_value: number
  supplier_payments: number
  outstanding: number
  outstanding_semantics?: string
  supply_history?: Array<{ supply: string; posting_date: string; item: string; item_name: string; payable_weight: number; value: number }>
  payment_history?: Array<{ payment: string; posting_date: string; amount: number; mode_of_payment?: string }>
}

const mapSummary = (raw: RawSummary): SupplierSummary => ({
  supplier: mapSupplierListItem(raw.supplier),
  fromDate: raw.from_date,
  toDate: raw.to_date,
  supplyCount: raw.supply_count,
  suppliedPayableWeight: raw.supplied_payable_weight,
  supplyValue: raw.supply_value,
  supplierPayments: raw.supplier_payments,
  outstanding: raw.outstanding,
  outstandingSemantics: raw.outstanding_semantics ?? '',
  supplyHistory: (raw.supply_history ?? []).map((row) => ({
    supply: row.supply,
    postingDate: row.posting_date,
    item: row.item,
    itemName: row.item_name,
    payableWeight: row.payable_weight,
    value: row.value,
  })),
  paymentHistory: (raw.payment_history ?? []).map((row) => ({
    payment: row.payment,
    postingDate: row.posting_date,
    amount: row.amount,
    modeOfPayment: row.mode_of_payment,
  })),
})

export function createSupplierService(transport: RpcTransport): SupplierService {
  return {
    async list(query = {}) {
      const raw = await transport.call<{ data: RawSupplier[]; page: number; page_size: number; total: number; has_more: boolean }>(
        `${API}.list_suppliers`,
        {
          page: query.page,
          page_size: query.pageSize,
          search: query.search,
          status: query.status,
          sort: query.sort ?? 'supplier_name asc',
        },
      )
      return {
        data: raw.data.map(mapSupplierListItem),
        page: raw.page,
        pageSize: raw.page_size,
        total: raw.total,
        hasMore: raw.has_more,
      } satisfies SupplierPage
    },
    async get(name) {
      return mapSupplierDetail(await transport.call<RawSupplier>(`${API}.get_supplier`, { name }))
    },
    async schema() {
      const raw = await transport.call<{
        required_fields: string[]
        optional_fields: string[]
        read_only_fields: string[]
        default_supplier_group?: string
        supplier_type_default: SupplierType
      }>(`${API}.get_new_supplier_schema`)
      return {
        requiredFields: raw.required_fields,
        optionalFields: raw.optional_fields,
        readOnlyFields: raw.read_only_fields,
        defaultSupplierGroup: raw.default_supplier_group,
        supplierTypeDefault: raw.supplier_type_default,
      } satisfies SupplierSchema
    },
    async create(input) {
      return mapSupplierDetail(
        await transport.call<RawSupplier>(`${API}.create_supplier`, {
          supplier_name: input.supplierName,
          supplier_type: input.supplierType,
          tax_id: input.taxId,
          supplier_details: input.supplierDetails,
        }),
      )
    },
    async capabilities(name) {
      const raw = await transport.call<{ capabilities: { can_read: boolean; can_create: boolean } }>(
        `${API}.get_capabilities`,
        name ? { name } : {},
      )
      return { capabilities: { canRead: raw.capabilities.can_read, canCreate: raw.capabilities.can_create, canEdit: false } }
    },
    async summary(name, fromDate, toDate) {
      return mapSummary(
        await transport.call<RawSummary>('cardboard_management.reporting.get_supplier_summary', {
          supplier: name,
          from_date: fromDate,
          to_date: toDate,
        }),
      )
    },
    async statement(name, fromDate, toDate) {
      return mapSummary(
        await transport.call<RawSummary>('cardboard_management.reporting.get_supplier_statement', {
          supplier: name,
          from_date: fromDate,
          to_date: toDate,
        }),
      )
    },
  }
}
