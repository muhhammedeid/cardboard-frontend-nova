import type { RpcTransport } from '@/services/api/frappe-rpc'
import type {
  CurrentInventoryFilter,
  CurrentInventoryReport,
  DateRangeFilter,
  ExpenseSummaryReport,
  InventoryMovementFilter,
  InventoryMovementReport,
  OperationsSummaryReport,
  ReportService,
  SalesReport,
  SalesReportFilter,
  SupplierStatementReport,
  SupplierSummaryFilter,
  SupplierStatementFilter,
  SupplierSummaryReport,
  SuppliesReport,
  SuppliesReportFilter,
} from '@/services/contracts/reports'

/**
 * Report adapters. Every path below is an app-owned method confirmed against
 * the frozen backend contract:
 *   - top-level modules        cardboard_management.reporting.* / .inventory.*
 *   - app-owned RPC package    cardboard_management.cardboard_management.api.*
 * (The supply list path previously carried a stale single-prefix package name,
 * which resolves to a Frappe command error; it is corrected here.)
 */
const REPORTING = 'cardboard_management.reporting'
const SUPPLY_API = 'cardboard_management.cardboard_management.api.supply'
const SALES_API = 'cardboard_management.cardboard_management.api.sales'

interface RawOperationsSummary {
  from_date: string
  to_date: string
  supplies: { count: number; quantity: number; payable_weight: number; value: number }
  sales: { count: number; quantity: number; value: number }
  supplier_payments: { count: number; amount: number }
  expenses: { count: number; amount: number }
}

interface RawCurrentInventory {
  selected_date: string
  is_today: boolean
  warehouse_name: string
  currency: string
  rows?: Array<{ item_code: string; item_name: string; stock_uom: string; quantity: number; stock_value: number }>
  summary?: { quantity: number | null; uom: string | null; stock_value: number }
}

interface RawInventoryMovement {
  from_date: string
  to_date: string
  inbound_quantity: number
  outbound_quantity: number
  net_quantity: number
  by_item?: Array<{ item: string; item_name: string; inbound: number; outbound: number; net: number }>
  by_date?: Array<{ date: string; inbound: number; outbound: number; net: number }>
}

interface RawExpenseSummary {
  from_date: string
  to_date: string
  expense_count: number
  total_expense_amount: number
  by_account?: Array<{ account: string; account_name: string; count: number; amount: number }>
}

interface RawSupplierSummary {
  supplier: { name: string; supplier_name: string }
  from_date: string
  to_date: string
  supply_count: number
  supplied_payable_weight: number
  supply_value: number
  supplier_payments: number
  outstanding: number
  submitted_only?: boolean
}

interface RawSupplierStatement extends RawSupplierSummary {
  entries: Array<
    | { type: 'supply'; posting_date: string; name: string; label: string; quantity: number; amount: number }
    | { type: 'payment'; posting_date: string; name: string; label: string; amount: number; mode_of_payment: string }
  >
  page?: number
  page_size?: number
  total?: number
  has_more?: boolean
}

interface RawPage<T> {
  data: T[]
  page: number
  page_size: number
  total: number
  has_more: boolean
}

interface RawSupplyRow {
  name: string
  posting_date: string
  supplier: string
  supplier_name: string
  item: string
  item_name: string
  payable_weight: number
  total_amount: number
  status: string
}

interface RawSalesRow {
  name: string
  posting_date: string
  buyer_name?: string
  item: string
  item_name: string
  quantity: number
  informational_value: number
  status: string
}

export function createReportService(transport: RpcTransport): ReportService {
  return {
    async operations(filter: DateRangeFilter): Promise<OperationsSummaryReport> {
      const raw = await transport.call<RawOperationsSummary>(`${REPORTING}.get_operations_summary`, {
        from_date: filter.fromDate,
        to_date: filter.toDate,
      })
      return {
        fromDate: raw.from_date,
        toDate: raw.to_date,
        supplies: {
          count: raw.supplies.count,
          quantity: raw.supplies.quantity,
          payableWeight: raw.supplies.payable_weight,
          value: raw.supplies.value,
        },
        sales: { count: raw.sales.count, quantity: raw.sales.quantity, informationalValue: raw.sales.value },
        supplierPayments: { count: raw.supplier_payments.count, amount: raw.supplier_payments.amount },
        expenses: { count: raw.expenses.count, amount: raw.expenses.amount },
      }
    },
    async inventory(filter: CurrentInventoryFilter): Promise<CurrentInventoryReport> {
      const raw = await transport.call<RawCurrentInventory>('cardboard_management.inventory.get_inventory_overview', {
        item_code: filter.itemCode,
        selected_date: filter.selectedDate,
      })
      return {
        selectedDate: raw.selected_date,
        isToday: raw.is_today,
        warehouseName: raw.warehouse_name,
        currency: raw.currency,
        rows: (raw.rows ?? []).map((row) => ({
          itemCode: row.item_code,
          itemName: row.item_name,
          uom: row.stock_uom,
          quantity: row.quantity,
          stockValue: row.stock_value,
        })),
        summary: {
          quantity: raw.summary?.quantity ?? null,
          uom: raw.summary?.uom ?? null,
          stockValue: raw.summary?.stock_value ?? 0,
        },
      }
    },
    async movement(filter: InventoryMovementFilter): Promise<InventoryMovementReport> {
      const raw = await transport.call<RawInventoryMovement>(`${REPORTING}.get_inventory_movement`, {
        from_date: filter.fromDate,
        to_date: filter.toDate,
        ...(filter.cardboardItem ? { cardboard_item: filter.cardboardItem } : {}),
      })
      return {
        fromDate: raw.from_date,
        toDate: raw.to_date,
        inbound: raw.inbound_quantity,
        outbound: raw.outbound_quantity,
        net: raw.net_quantity,
        byItem: (raw.by_item ?? []).map((row) => ({
          itemCode: row.item,
          itemName: row.item_name,
          inbound: row.inbound,
          outbound: row.outbound,
          net: row.net,
        })),
        byDate: (raw.by_date ?? []).map((row) => ({ date: row.date, inbound: row.inbound, outbound: row.outbound, net: row.net })),
      }
    },
    async expenses(filter: DateRangeFilter): Promise<ExpenseSummaryReport> {
      const raw = await transport.call<RawExpenseSummary>(`${REPORTING}.get_expense_summary`, {
        from_date: filter.fromDate,
        to_date: filter.toDate,
      })
      return {
        fromDate: raw.from_date,
        toDate: raw.to_date,
        count: raw.expense_count,
        totalAmount: raw.total_expense_amount,
        categories: (raw.by_account ?? []).map((row) => ({ label: row.account_name, count: row.count, amount: row.amount })),
      }
    },
    async supplierSummary(filter: SupplierSummaryFilter): Promise<SupplierSummaryReport> {
      const raw = await transport.call<RawSupplierSummary>(`${REPORTING}.get_supplier_summary`, {
        supplier: filter.supplier,
        from_date: filter.fromDate,
        to_date: filter.toDate,
      })
      return {
        supplier: { name: raw.supplier.name, nameLabel: raw.supplier.supplier_name },
        fromDate: raw.from_date,
        toDate: raw.to_date,
        supplyCount: raw.supply_count,
        suppliedPayableWeight: raw.supplied_payable_weight,
        suppliedValue: raw.supply_value,
        paidAmount: raw.supplier_payments,
        currentOutstanding: raw.outstanding,
        submittedOnly: raw.submitted_only ?? true,
      }
    },
    async supplierStatement(filter: SupplierStatementFilter): Promise<SupplierStatementReport> {
      const raw = await transport.call<RawSupplierStatement>(`${REPORTING}.get_supplier_statement`, {
        supplier: filter.supplier,
        from_date: filter.fromDate,
        to_date: filter.toDate,
        page: filter.page,
        page_size: filter.pageSize,
      })
      return {
        supplier: { name: raw.supplier.name, nameLabel: raw.supplier.supplier_name },
        fromDate: raw.from_date,
        toDate: raw.to_date,
        supplyCount: raw.supply_count,
        suppliedPayableWeight: raw.supplied_payable_weight,
        suppliedValue: raw.supply_value,
        paidAmount: raw.supplier_payments,
        currentOutstanding: raw.outstanding,
        submittedOnly: raw.submitted_only ?? true,
        page: raw.page ?? 1,
        pageSize: raw.page_size ?? raw.entries.length,
        total: raw.total ?? raw.entries.length,
        hasMore: Boolean(raw.has_more),
        entries: raw.entries.map((entry) =>
          entry.type === 'supply'
            ? {
                type: 'supply' as const,
                name: entry.name,
                postingDate: entry.posting_date,
                label: entry.label,
                quantity: entry.quantity,
                amount: entry.amount,
              }
            : {
                type: 'payment' as const,
                name: entry.name,
                postingDate: entry.posting_date,
                label: entry.label,
                amount: entry.amount,
                modeOfPayment: entry.mode_of_payment,
              },
        ),
      }
    },
    async supplies(filter: SuppliesReportFilter): Promise<SuppliesReport> {
      const raw = await transport.call<RawPage<RawSupplyRow>>(`${SUPPLY_API}.list_supplies`, {
        date_from: filter.fromDate,
        date_to: filter.toDate,
        supplier: filter.supplier,
        item: filter.item,
        page: filter.page,
        page_size: filter.pageSize,
      })
      return {
        fromDate: filter.fromDate ?? '',
        toDate: filter.toDate ?? '',
        page: raw.page,
        pageSize: raw.page_size,
        total: raw.total,
        hasMore: raw.has_more,
        rows: raw.data.map((row) => ({
          name: row.name,
          postingDate: row.posting_date,
          supplier: row.supplier,
          supplierName: row.supplier_name,
          item: row.item,
          itemName: row.item_name,
          payableWeight: row.payable_weight,
          value: row.total_amount,
          status: row.status,
        })),
      }
    },
    async sales(filter: SalesReportFilter): Promise<SalesReport> {
      const raw = await transport.call<RawPage<RawSalesRow>>(`${SALES_API}.list_sales`, {
        from_date: filter.fromDate,
        to_date: filter.toDate,
        item: filter.item,
        buyer: filter.buyer,
        search: filter.search,
        page: filter.page,
        page_size: filter.pageSize,
      })
      return {
        fromDate: filter.fromDate ?? '',
        toDate: filter.toDate ?? '',
        page: raw.page,
        pageSize: raw.page_size,
        total: raw.total,
        hasMore: raw.has_more,
        rows: raw.data.map((row) => ({
          name: row.name,
          postingDate: row.posting_date,
          buyerName: row.buyer_name,
          item: row.item,
          itemName: row.item_name,
          quantity: row.quantity,
          informationalValue: row.informational_value,
          status: row.status,
        })),
      }
    },
  }
}
