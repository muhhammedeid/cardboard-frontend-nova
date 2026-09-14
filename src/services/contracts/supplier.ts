import type { Page } from './index'
import type { SupplierStatementReport } from './reports'

export type SupplierType = 'Company' | 'Individual' | 'Partnership'

export interface SupplierListItem {
  name: string
  supplierName: string
  supplierGroup?: string
  disabled: boolean
}

export interface SupplierCapabilities {
  canRead: boolean
  canCreate: boolean
  /** The server grants supplier edits through the document write permission. */
  canEdit: boolean
}

export interface SupplierDetail extends SupplierListItem {
  supplierType: SupplierType
  mobileNo?: string
  emailId?: string
  primaryAddress?: string
  taxId?: string
  supplierDetails?: string
  capabilities: SupplierCapabilities
}

export interface CreateSupplierRequest {
  supplierName: string
  supplierType?: SupplierType
  taxId?: string
  supplierDetails?: string
}

export type SupplierPage = Page<SupplierListItem>

export interface SupplierSummary {
  supplier: SupplierListItem
  fromDate: string
  toDate: string
  supplyCount: number
  suppliedPayableWeight: number
  supplyValue: number
  supplierPayments: number
  outstanding: number
  outstandingSemantics: string
  /** Server-stated: history and totals cover submitted documents only. */
  submittedOnly: boolean
  supplyHistory: Array<{ supply: string; postingDate: string; item: string; itemName: string; payableWeight: number; value: number }>
  paymentHistory: Array<{ payment: string; postingDate: string; amount: number; modeOfPayment?: string }>
}

export interface SupplierSchema {
  requiredFields: string[]
  optionalFields: string[]
  readOnlyFields: string[]
  defaultSupplierGroup?: string
  supplierTypeDefault: SupplierType
}

export type SupplierListQuery = Partial<{
  page: number
  pageSize: number
  search: string
  status: 'enabled' | 'disabled'
  sort: string
}>

export interface SupplierService {
  list(query?: SupplierListQuery): Promise<SupplierPage>
  get(name: string): Promise<SupplierDetail>
  schema(): Promise<SupplierSchema>
  create(input: CreateSupplierRequest): Promise<SupplierDetail>
  /** Edits the same fields the create form captured. */
  update(name: string, input: CreateSupplierRequest): Promise<SupplierDetail>
  capabilities(name?: string): Promise<{ capabilities: SupplierCapabilities }>
  summary(name: string, fromDate?: string, toDate?: string): Promise<SupplierSummary>
  statement(name: string, fromDate?: string, toDate?: string, page?: number, pageSize?: number): Promise<SupplierStatementReport>
}
