import type { Page } from './index'

export interface DateRangeFilter {
  fromDate?: string
  toDate?: string
}

export interface CurrentInventoryFilter {
  itemCode?: string
  selectedDate?: string
}

export interface InventoryMovementFilter extends DateRangeFilter {
  cardboardItem?: string
}

export interface SupplierSummaryFilter extends DateRangeFilter {
  supplier: string
}

export interface OperationsSummaryReport {
  fromDate: string
  toDate: string
  supplies: { count: number; quantity: number; payableWeight: number; value: number }
  sales: { count: number; quantity: number; informationalValue: number }
  supplierPayments: { count: number; amount: number }
  expenses: { count: number; amount: number }
}

export interface CurrentInventoryReport {
  selectedDate: string
  isToday: boolean
  warehouseName: string
  currency: string
  rows: Array<{ itemCode: string; itemName: string; uom: string; quantity: number; stockValue: number }>
  summary: { quantity: number | null; uom: string | null; stockValue: number }
}

export interface InventoryMovementReport {
  fromDate: string
  toDate: string
  inbound: number
  outbound: number
  net: number
  byItem: Array<{ itemCode: string; itemName: string; inbound: number; outbound: number; net: number }>
  byDate: Array<{ date: string; inbound: number; outbound: number; net: number }>
}

export interface ExpenseSummaryReport {
  fromDate: string
  toDate: string
  totalAmount: number
  count: number
  categories: Array<{ label: string; count: number; amount: number }>
}

export interface SupplierSummaryReport {
  supplier: { name: string; nameLabel: string }
  fromDate: string
  toDate: string
  supplyCount: number
  suppliedPayableWeight: number
  suppliedValue: number
  paidAmount: number
  currentOutstanding: number
}

export interface SupplierStatementEntry {
  type: 'supply' | 'payment'
  name: string
  postingDate: string
  label: string
  quantity?: number
  amount: number
  modeOfPayment?: string
}

export interface SupplierStatementReport extends SupplierSummaryReport {
  entries: SupplierStatementEntry[]
}

export interface SuppliesReportFilter extends DateRangeFilter {
  supplier?: string
  item?: string
  page?: number
  pageSize?: number
}

export interface SalesReportFilter extends DateRangeFilter {
  item?: string
  buyer?: string
  search?: string
  page?: number
  pageSize?: number
}

export interface SuppliesReport {
  fromDate: string
  toDate: string
  page: number
  pageSize: number
  total: number
  hasMore: boolean
  rows: Array<{
    name: string
    postingDate: string
    supplier: string
    supplierName: string
    item: string
    itemName: string
    payableWeight: number
    value: number
    status: string
  }>
}

export interface SalesReport {
  fromDate: string
  toDate: string
  page: number
  pageSize: number
  total: number
  hasMore: boolean
  rows: Array<{
    name: string
    postingDate: string
    buyerName?: string
    item: string
    itemName: string
    quantity: number
    informationalValue: number
    status: string
  }>
}

export interface ReportService {
  operations(filter: DateRangeFilter): Promise<OperationsSummaryReport>
  inventory(filter: CurrentInventoryFilter): Promise<CurrentInventoryReport>
  movement(filter: InventoryMovementFilter): Promise<InventoryMovementReport>
  expenses(filter: DateRangeFilter): Promise<ExpenseSummaryReport>
  supplierSummary(filter: SupplierSummaryFilter): Promise<SupplierSummaryReport>
  supplierStatement(filter: SupplierSummaryFilter): Promise<SupplierStatementReport>
  supplies(filter: SuppliesReportFilter): Promise<SuppliesReport>
  sales(filter: SalesReportFilter): Promise<SalesReport>
}

export type ReportPage<T> = Page<T>
