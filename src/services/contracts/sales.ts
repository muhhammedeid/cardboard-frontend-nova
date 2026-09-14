import type { Page } from './index'

export type SaleStatus = 'Draft' | 'Submitted' | 'Cancelled'

export type SaleErrorCode =
  | 'validation'
  | 'insufficient_stock'
  | 'permission_denied'
  | 'not_found'
  | 'invalid_state'
  | 'configuration_error'
  | 'unexpected_error'

export interface SaleError {
  code: SaleErrorCode
  message: string
  field?: string
}

export interface SaleCapabilities {
  canEdit: boolean
  canSubmit: boolean
  canCancel: boolean
}

/** Answer for a create form, which has no document to ask about yet. */
export interface SaleCreateCapabilities {
  canCreate: boolean
  canSubmit: boolean
}

export interface SaleListItem {
  name: string
  postingDate: string
  buyerName?: string
  item: string
  itemName: string
  quantity: number
  ratePerKg: number
  totalAmount: number
  informationalValue: number
  status: SaleStatus
  docstatus: 0 | 1 | 2
}

export interface SaleDetail extends SaleListItem {
  notes?: string
  company: string
  warehouse: string
  stockEntry?: string
  capabilities: SaleCapabilities
}

export interface SaleInput {
  postingDate: string
  item: string
  quantity: number
  ratePerKg: number
  buyerName?: string
  notes?: string
}

export type SalePage = Page<SaleListItem>

export interface SaleLookup {
  name: string
  label: string
}

export type SaleListQuery = Partial<{
  fromDate: string
  toDate: string
  item: string
  buyer: string
  status: SaleStatus
  search: string
  page: number
  pageSize: number
}>

export interface SalesService {
  list(query?: SaleListQuery): Promise<SalePage>
  get(name: string): Promise<SaleDetail>
  lookupBuyers(search?: string): Promise<string[]>
  lookupItems(search?: string): Promise<SaleLookup[]>
  create(input: SaleInput): Promise<SaleDetail>
  update(name: string, input: SaleInput): Promise<SaleDetail>
  submit(name: string): Promise<SaleDetail>
  cancel(name: string): Promise<SaleDetail>
  getCapabilities(name: string): Promise<SaleCapabilities>
  getCreateCapabilities(): Promise<SaleCreateCapabilities>
  formAction(name: string): Promise<{ url: string; deskRoute: string; query: string }>
}
