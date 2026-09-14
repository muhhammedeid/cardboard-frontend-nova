import type { RpcTransport } from '@/services/api/frappe-rpc'
import type {
  ExpenseDetail,
  ExpenseInput,
  ExpenseItem,
  ExpenseListQuery,
  ExpenseOption,
  ExpensePage,
  ExpenseService,
} from '@/services/contracts'

const API = 'cardboard_management.cardboard_management.api.expenses'

interface RawExpense {
  name: string
  posting_date: string
  expense_category: string
  expense_category_name: string
  amount: number
  payment_source?: string
  payment_source_name?: string
  payment_mode?: string
  status: ExpenseItem['status']
  docstatus: 0 | 1 | 2
  supplier_or_party?: string
  description?: string
  attachment?: string
  reference_no?: string
  reference_date?: string
  accounting_status?: string
  capabilities?: { can_read: boolean; can_edit: boolean; can_submit: boolean; can_cancel: boolean }
}

const mapItem = (raw: RawExpense): ExpenseItem => ({
  name: raw.name,
  postingDate: raw.posting_date,
  expenseCategory: raw.expense_category,
  expenseCategoryName: raw.expense_category_name,
  amount: raw.amount,
  paymentSource: raw.payment_source,
  paymentSourceName: raw.payment_source_name,
  paymentMode: raw.payment_mode,
  status: raw.status,
  docstatus: raw.docstatus,
})

const mapDetail = (raw: RawExpense): ExpenseDetail => ({
  ...mapItem(raw),
  supplierOrParty: raw.supplier_or_party,
  description: raw.description,
  attachment: raw.attachment,
  referenceNo: raw.reference_no,
  referenceDate: raw.reference_date,
  accountingStatus: raw.accounting_status,
  capabilities: {
    canRead: Boolean(raw.capabilities?.can_read),
    canEdit: Boolean(raw.capabilities?.can_edit),
    canSubmit: Boolean(raw.capabilities?.can_submit),
    canCancel: Boolean(raw.capabilities?.can_cancel),
  },
})

const editableFields = (input: ExpenseInput) => ({
  posting_date: input.postingDate,
  expense_category: input.expenseCategory,
  amount: input.amount,
  payment_source: input.paymentSource,
  payment_mode: input.paymentMode,
  supplier_or_party: input.supplierOrParty,
  description: input.description,
  attachment: input.attachment,
  reference_no: input.referenceNo,
  reference_date: input.referenceDate,
})

const mapOptions = (raw: { data: Array<{ name: string; display_name?: string }> }): ExpenseOption[] =>
  raw.data.map((row) => ({ name: row.name, displayName: row.display_name ?? row.name }))

export function createExpenseService(transport: RpcTransport): ExpenseService {
  return {
    async list(query: ExpenseListQuery = {}) {
      const raw = await transport.call<{ data: RawExpense[]; page: number; page_size: number; total: number; has_more: boolean }>(
        `${API}.list_expenses`,
        {
          from_date: query.fromDate,
          to_date: query.toDate,
          expense_category: query.expenseCategory,
          status: query.status,
          search: query.search,
          page: query.page,
          page_size: query.pageSize,
        },
      )
      return {
        data: raw.data.map(mapItem),
        page: raw.page,
        pageSize: raw.page_size,
        total: raw.total,
        hasMore: raw.has_more,
      } satisfies ExpensePage
    },
    async get(name) {
      return mapDetail(await transport.call<RawExpense>(`${API}.get_expense`, { name }))
    },
    async categories() {
      return mapOptions(await transport.call<{ data: Array<{ name: string; display_name?: string }> }>(`${API}.lookup_expense_categories`))
    },
    async sources() {
      return mapOptions(
        await transport.call<{ data: Array<{ name: string; display_name?: string }> }>(`${API}.lookup_expense_payment_sources`),
      )
    },
    async schema() {
      const raw = await transport.call<{ default_posting_date: string }>(`${API}.get_new_expense_schema`)
      return { defaultPostingDate: raw.default_posting_date }
    },
    async create(input) {
      return mapDetail(await transport.call<RawExpense>(`${API}.create_expense`, editableFields(input)))
    },
    async update(name, input) {
      return mapDetail(await transport.call<RawExpense>(`${API}.update_expense`, { name, ...editableFields(input) }))
    },
    async submit(name) {
      return mapDetail(await transport.call<RawExpense>(`${API}.submit_expense`, { name }))
    },
    async cancel(name) {
      return mapDetail(await transport.call<RawExpense>(`${API}.cancel_expense`, { name }))
    },
  }
}
