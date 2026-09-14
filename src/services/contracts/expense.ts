import type { Page } from './index'

export type ExpenseStatus = 'Draft' | 'Submitted' | 'Cancelled'

export interface ExpenseCapabilities {
  canRead: boolean
  canEdit: boolean
  canSubmit: boolean
  canCancel: boolean
}

export interface ExpenseItem {
  name: string
  postingDate: string
  expenseCategory: string
  expenseCategoryName: string
  amount: number
  paymentSource?: string
  paymentSourceName?: string
  paymentMode?: string
  status: ExpenseStatus
  docstatus: 0 | 1 | 2
}

export interface ExpenseDetail extends ExpenseItem {
  supplierOrParty?: string
  description?: string
  attachment?: string
  referenceNo?: string
  referenceDate?: string
  accountingStatus?: string
  capabilities: ExpenseCapabilities
}

export interface ExpenseInput {
  postingDate: string
  expenseCategory: string
  amount: number
  paymentSource: string
  paymentMode?: string
  supplierOrParty?: string
  description?: string
  attachment?: string
  referenceNo?: string
  referenceDate?: string
}

export interface ExpenseOption {
  name: string
  displayName: string
}

export type ExpensePage = Page<ExpenseItem>

export type ExpenseListQuery = Partial<{
  fromDate: string
  toDate: string
  expenseCategory: string
  status: ExpenseStatus
  search: string
  page: number
  pageSize: number
}>

export interface ExpenseService {
  list(query?: ExpenseListQuery): Promise<ExpensePage>
  get(name: string): Promise<ExpenseDetail>
  categories(): Promise<ExpenseOption[]>
  sources(): Promise<ExpenseOption[]>
  schema(): Promise<{ defaultPostingDate: string }>
  create(input: ExpenseInput): Promise<ExpenseDetail>
  update(name: string, input: ExpenseInput): Promise<ExpenseDetail>
  submit(name: string): Promise<ExpenseDetail>
  cancel(name: string): Promise<ExpenseDetail>
}
