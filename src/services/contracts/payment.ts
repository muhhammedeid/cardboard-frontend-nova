import type { Page } from './index'

export type PaymentStatus = 'Draft' | 'Submitted' | 'Cancelled'

export interface PaymentCapabilities {
  canRead: boolean
  canEdit: boolean
  canSubmit: boolean
  canCancel: boolean
}

export interface PaymentListItem {
  name: string
  postingDate: string
  supplier: string
  supplierName: string
  amount: number
  modeOfPayment: string
  status: PaymentStatus
  docstatus: 0 | 1 | 2
}

export interface PaymentDetail extends PaymentListItem {
  referenceNo?: string
  referenceDate?: string
  notes?: string
  paymentStatus?: string
  currentSupplierOutstanding?: number | null
  expectedRemainingOutstanding?: number | null
  capabilities: PaymentCapabilities
}

export interface PaymentInput {
  supplier: string
  amount: number
  modeOfPayment: string
  postingDate: string
  referenceNo?: string
  referenceDate?: string
  notes?: string
}

export type PaymentPage = Page<PaymentListItem>

export interface PaymentSchema {
  defaultPostingDate: string
  defaultModeOfPayment?: string
  capabilities: { canCreate: boolean }
}

export interface PaymentContext {
  company?: string
  currentSupplierOutstanding?: number | null
}

export interface SupplierOption {
  supplier: string
  supplierName: string
  disabled: boolean
}

export type PaymentListQuery = Partial<{
  fromDate: string
  toDate: string
  supplier: string
  modeOfPayment: string
  status: PaymentStatus
  search: string
  page: number
  pageSize: number
}>

export interface PaymentService {
  list(query?: PaymentListQuery): Promise<PaymentPage>
  get(name: string): Promise<PaymentDetail>
  lookupSuppliers(search?: string): Promise<SupplierOption[]>
  lookupModes(search?: string): Promise<string[]>
  schema(): Promise<PaymentSchema>
  context(supplier: string): Promise<PaymentContext>
  create(input: PaymentInput): Promise<PaymentDetail>
  update(name: string, input: PaymentInput): Promise<PaymentDetail>
  submit(name: string): Promise<PaymentDetail>
  cancel(name: string): Promise<PaymentDetail>
}
