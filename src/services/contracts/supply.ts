import type { Lookup, Page } from './index'

export type SupplyStatus = 'Draft' | 'Submitted' | 'Cancelled'
export type DiscountType = 'No Discount' | 'Kg' | 'Percentage'

export interface SupplyCapabilities {
  canEdit: boolean
  canSubmit: boolean
  canCancel: boolean
  canCaptureGross: boolean
  canCaptureTare: boolean
  canPrint: boolean
}

export interface SupplyCreateCapabilities {
  canCreate: boolean
  canSubmit: boolean
}

export interface SupplyPreview {
  netWeight: number
  discountWeight: number
  payableWeight: number
  displayPayableWeight: number
  totalAmount: number
}

export interface SupplyListItem {
  name: string
  postingDate: string
  supplier: string
  supplierName: string
  item: string
  itemName: string
  payableWeight: number
  totalAmount: number
  status: SupplyStatus
  docstatus: 0 | 1 | 2
}

export interface SupplyDetail extends SupplyListItem {
  warehouse: string
  grossWeight: number
  tareWeight: number
  netWeight: number
  discountType: DiscountType
  discountValue: number
  discountWeight: number
  displayPayableWeight: number
  ratePerKg: number
  paymentStatus?: string
  purchaseInvoiceOutstanding?: number
  invoiceTotal?: number
  invoicePaidAmount?: number
  integrationStatus?: string
  vehicleNo?: string
  driverName?: string
  weightTicket?: string
  supplierReceipt?: string
  notes?: string
  capabilities: SupplyCapabilities
}

export interface SupplyInput {
  postingDate: string
  supplier: string
  item: string
  grossWeight: number
  tareWeight: number
  ratePerKg: number
  discountType: DiscountType
  discountValue: number
  vehicleNo?: string
  driverName?: string
  weightTicket?: string
  supplierReceipt?: string
  notes?: string
}

export type SupplyPage = Page<SupplyListItem>

export type SupplyListQuery = Partial<{
  dateFrom: string
  dateTo: string
  supplier: string
  item: string
  status: SupplyStatus
  search: string
  page: number
  pageSize: number
}>

export interface SupplyService {
  list(query?: SupplyListQuery): Promise<SupplyPage>
  get(name: string): Promise<SupplyDetail>
  lookupSuppliers(search?: string): Promise<Lookup[]>
  lookupItems(search?: string): Promise<Lookup[]>
  getCreateCapabilities(): Promise<SupplyCreateCapabilities>
  preview(input: SupplyInput): Promise<SupplyPreview>
  create(input: SupplyInput): Promise<SupplyDetail>
  update(name: string, input: SupplyInput): Promise<SupplyDetail>
  submit(name: string): Promise<SupplyDetail>
  cancel(name: string): Promise<SupplyDetail>
  capture(name: string, field: 'gross' | 'tare', weight?: number): Promise<SupplyDetail>
  print(name: string): Promise<{ url: string; format: string }>
}
