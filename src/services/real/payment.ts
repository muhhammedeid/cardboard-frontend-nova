import type { RpcTransport } from '@/services/api/frappe-rpc'
import type {
  PaymentDetail,
  PaymentInput,
  PaymentListItem,
  PaymentListQuery,
  PaymentPage,
  PaymentSchema,
  PaymentService,
  SupplierOption,
} from '@/services/contracts'

const API = 'cardboard_management.cardboard_management.api.supplier_payments'

interface RawPayment {
  name: string
  posting_date: string
  supplier: string
  supplier_name: string
  amount: number
  mode_of_payment: string
  status: PaymentListItem['status']
  docstatus: 0 | 1 | 2
  reference_no?: string
  reference_date?: string
  notes?: string
  payment_status?: string
  current_supplier_outstanding?: number | null
  expected_remaining_outstanding?: number | null
  capabilities?: { can_read: boolean; can_edit: boolean; can_submit: boolean; can_cancel: boolean }
}

const mapListItem = (raw: RawPayment): PaymentListItem => ({
  name: raw.name,
  postingDate: raw.posting_date,
  supplier: raw.supplier,
  supplierName: raw.supplier_name,
  amount: raw.amount,
  modeOfPayment: raw.mode_of_payment,
  status: raw.status,
  docstatus: raw.docstatus,
})

const mapDetail = (raw: RawPayment): PaymentDetail => ({
  ...mapListItem(raw),
  referenceNo: raw.reference_no,
  referenceDate: raw.reference_date,
  notes: raw.notes,
  paymentStatus: raw.payment_status,
  currentSupplierOutstanding: raw.current_supplier_outstanding,
  expectedRemainingOutstanding: raw.expected_remaining_outstanding,
  capabilities: {
    canRead: Boolean(raw.capabilities?.can_read),
    canEdit: Boolean(raw.capabilities?.can_edit),
    canSubmit: Boolean(raw.capabilities?.can_submit),
    canCancel: Boolean(raw.capabilities?.can_cancel),
  },
})

const editableFields = (input: PaymentInput) => ({
  supplier: input.supplier,
  amount: input.amount,
  mode_of_payment: input.modeOfPayment,
  posting_date: input.postingDate,
  reference_no: input.referenceNo,
  reference_date: input.referenceDate,
  notes: input.notes,
})

export function createPaymentService(transport: RpcTransport): PaymentService {
  return {
    async list(query: PaymentListQuery = {}) {
      const raw = await transport.call<{ data: RawPayment[]; page: number; page_size: number; total: number; has_more: boolean }>(
        `${API}.list_supplier_payments`,
        {
          from_date: query.fromDate,
          to_date: query.toDate,
          supplier: query.supplier,
          mode_of_payment: query.modeOfPayment,
          status: query.status,
          search: query.search,
          page: query.page,
          page_size: query.pageSize,
        },
      )
      return {
        data: raw.data.map(mapListItem),
        page: raw.page,
        pageSize: raw.page_size,
        total: raw.total,
        hasMore: raw.has_more,
      } satisfies PaymentPage
    },
    async get(name) {
      return mapDetail(await transport.call<RawPayment>(`${API}.get_supplier_payment`, { name }))
    },
    async lookupSuppliers(search) {
      const raw = await transport.call<{ data: SupplierOption[] }>(`${API}.lookup_suppliers`, { search })
      return raw.data
    },
    async lookupModes(search) {
      const raw = await transport.call<{ data: Array<{ name: string }> }>(`${API}.lookup_modes_of_payment`, { search })
      return raw.data.map((row) => row.name)
    },
    async schema() {
      const raw = await transport.call<{
        default_posting_date: string
        default_mode_of_payment?: string
        capabilities: { can_create: boolean }
      }>(`${API}.get_new_supplier_payment_schema`)
      return {
        defaultPostingDate: raw.default_posting_date,
        defaultModeOfPayment: raw.default_mode_of_payment,
        capabilities: { canCreate: raw.capabilities.can_create },
      } satisfies PaymentSchema
    },
    async context(supplier) {
      const raw = await transport.call<{ company?: string; current_supplier_outstanding?: number | null }>(
        `${API}.get_supplier_payment_context`,
        { supplier },
      )
      return { company: raw.company, currentSupplierOutstanding: raw.current_supplier_outstanding }
    },
    async create(input) {
      return mapDetail(await transport.call<RawPayment>(`${API}.create_supplier_payment`, editableFields(input)))
    },
    async update(name, input) {
      return mapDetail(await transport.call<RawPayment>(`${API}.update_supplier_payment`, { name, ...editableFields(input) }))
    },
    async submit(name) {
      return mapDetail(await transport.call<RawPayment>(`${API}.submit_supplier_payment`, { name }))
    },
    async cancel(name) {
      return mapDetail(await transport.call<RawPayment>(`${API}.cancel_supplier_payment`, { name }))
    },
  }
}
