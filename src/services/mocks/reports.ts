import { FrontendError } from '@/services/api/errors'
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
  SupplierStatementFilter,
  SupplierSummaryFilter,
  SupplierSummaryReport,
  SuppliesReport,
  SuppliesReportFilter,
} from '@/services/contracts/reports'
import { MOCK_TODAY, mockInventory, mockOperationsSummary } from './dataset'

/**
 * Deterministic report fixtures. The scenario selector lets the same typed
 * methods express normal, empty, and error states — the app's normalized error
 * type is thrown instead of ad-hoc exceptions.
 */
export type ReportMockScenarioName = 'normal' | 'empty' | 'error'

export interface ReportMockScenario {
  all?: ReportMockScenarioName
  operations?: ReportMockScenarioName
  inventory?: ReportMockScenarioName
  movement?: ReportMockScenarioName
  expenses?: ReportMockScenarioName
  supplierSummary?: ReportMockScenarioName
  supplierStatement?: ReportMockScenarioName
  supplies?: ReportMockScenarioName
  sales?: ReportMockScenarioName
}

const delay = (ms = 160) => new Promise((resolve) => setTimeout(resolve, ms))

function scenarioFor(scenario: ReportMockScenario, key: keyof ReportMockScenario): ReportMockScenarioName {
  return scenario[key] ?? scenario.all ?? 'normal'
}

function fail(): never {
  throw new FrontendError('unexpected', 'تعذر تحميل بيانات التقرير التجريبية.')
}

const range = (filter: DateRangeFilter) => ({ fromDate: filter.fromDate ?? MOCK_TODAY, toDate: filter.toDate ?? MOCK_TODAY })

export function createMockReportService(scenario: ReportMockScenario = {}): ReportService {
  return {
    async operations(filter): Promise<OperationsSummaryReport> {
      await delay()
      const mode = scenarioFor(scenario, 'operations')
      if (mode === 'error') fail()
      if (mode === 'empty') {
        return {
          ...range(filter),
          supplies: { count: 0, quantity: 0, payableWeight: 0, value: 0 },
          sales: { count: 0, quantity: 0, informationalValue: 0 },
          supplierPayments: { count: 0, amount: 0 },
          expenses: { count: 0, amount: 0 },
        }
      }
      return {
        ...range(filter),
        supplies: mockOperationsSummary.supplies,
        sales: {
          count: mockOperationsSummary.sales.count,
          quantity: mockOperationsSummary.sales.quantity,
          informationalValue: mockOperationsSummary.sales.value,
        },
        supplierPayments: mockOperationsSummary.supplierPayments,
        expenses: mockOperationsSummary.expenses,
      }
    },
    async inventory(filter: CurrentInventoryFilter): Promise<CurrentInventoryReport> {
      await delay()
      const mode = scenarioFor(scenario, 'inventory')
      if (mode === 'error') fail()
      if (mode === 'empty') {
        return {
          selectedDate: filter.selectedDate ?? MOCK_TODAY,
          isToday: true,
          warehouseName: mockInventory.warehouseName,
          currency: 'EGP',
          rows: [],
          summary: { quantity: null, uom: null, stockValue: 0 },
        }
      }
      const rows = filter.itemCode ? mockInventory.rows.filter((row) => row.itemCode === filter.itemCode) : mockInventory.rows
      return {
        selectedDate: filter.selectedDate ?? MOCK_TODAY,
        isToday: (filter.selectedDate ?? MOCK_TODAY) === MOCK_TODAY,
        warehouseName: mockInventory.warehouseName,
        currency: mockInventory.currency,
        rows: rows.map((row) => ({
          itemCode: row.itemCode,
          itemName: row.itemName,
          uom: row.stockUom,
          quantity: row.quantity,
          stockValue: row.stockValue,
        })),
        summary: { ...mockInventory.summary },
      }
    },
    async movement(filter: InventoryMovementFilter): Promise<InventoryMovementReport> {
      await delay()
      const mode = scenarioFor(scenario, 'movement')
      if (mode === 'error') fail()
      if (mode === 'empty') return { ...range(filter), inbound: 0, outbound: 0, net: 0, byItem: [], byDate: [] }
      return {
        ...range(filter),
        inbound: 6950,
        outbound: 1850,
        net: 5100,
        byItem: [
          { itemCode: filter.cardboardItem ?? 'CARD-DUPLEX-300', itemName: 'كرتون دوبلكس 300 جرام', inbound: 5120, outbound: 1250, net: 3870 },
          { itemCode: 'CARD-KRAFT-120', itemName: 'كرتون كرافت 120 جرام', inbound: 1830, outbound: 600, net: 1230 },
        ],
        byDate: [
          { date: filter.toDate ?? MOCK_TODAY, inbound: 6950, outbound: 1250, net: 5700 },
          { date: filter.fromDate ?? MOCK_TODAY, inbound: 0, outbound: 600, net: -600 },
        ],
      }
    },
    async expenses(filter: DateRangeFilter): Promise<ExpenseSummaryReport> {
      await delay()
      const mode = scenarioFor(scenario, 'expenses')
      if (mode === 'error') fail()
      if (mode === 'empty') return { ...range(filter), count: 0, totalAmount: 0, categories: [] }
      return {
        ...range(filter),
        count: 4,
        totalAmount: 6150,
        categories: [
          { label: 'نقل وشحن', count: 2, amount: 3600 },
          { label: 'صيانة', count: 1, amount: 950 },
          { label: 'كهرباء ومياه', count: 1, amount: 1600 },
        ],
      }
    },
    async supplierSummary(filter: SupplierSummaryFilter): Promise<SupplierSummaryReport> {
      await delay()
      const mode = scenarioFor(scenario, 'supplierSummary')
      if (mode === 'error') fail()
      const base = { supplier: { name: filter.supplier, nameLabel: 'مصنع النور للكرتون' }, ...range(filter) }
      if (mode === 'empty') {
        return { ...base, supplyCount: 0, suppliedPayableWeight: 0, suppliedValue: 0, paidAmount: 0, currentOutstanding: 0, submittedOnly: true }
      }
      return { ...base, supplyCount: 12, suppliedPayableWeight: 48250, suppliedValue: 313625, paidAmount: 286345, currentOutstanding: 27280, submittedOnly: true }
    },
    async supplierStatement(filter: SupplierStatementFilter): Promise<SupplierStatementReport> {
      await delay()
      const mode = scenarioFor(scenario, 'supplierStatement')
      if (mode === 'error') fail()
      const base = { supplier: { name: filter.supplier, nameLabel: 'مصنع النور للكرتون' }, ...range(filter) }
      const window = { page: 1, pageSize: 200, submittedOnly: true }
      if (mode === 'empty') {
        return { ...base, ...window, supplyCount: 0, suppliedPayableWeight: 0, suppliedValue: 0, paidAmount: 0, currentOutstanding: 0, total: 0, hasMore: false, entries: [] }
      }
      return {
        ...base,
        ...window,
        supplyCount: 3,
        suppliedPayableWeight: 17510,
        suppliedValue: 121215,
        paidAmount: 36000,
        currentOutstanding: 27280,
        total: 5,
        hasMore: false,
        entries: [
          { type: 'supply', name: 'CS-2026-0143', postingDate: '2026-09-14', label: 'كرتون دوبلكس 300 جرام', quantity: 5120, amount: 33280 },
          { type: 'payment', name: 'CSP-2026-0031', postingDate: '2026-09-14', label: 'تحويل بنكي', amount: 15000, modeOfPayment: 'تحويل بنكي' },
          { type: 'supply', name: 'CS-2026-0141', postingDate: '2026-09-13', label: 'كرتون أبيض مطبوع 250 جرام', quantity: 7400, amount: 55500 },
          { type: 'payment', name: 'CSP-2026-0026', postingDate: '2026-09-08', label: 'نقدي', amount: 21000, modeOfPayment: 'نقدي' },
          { type: 'supply', name: 'CS-2026-0138', postingDate: '2026-08-31', label: 'كرتون دوبلكس 300 جرام', quantity: 4990, amount: 32435 },
        ],
      }
    },
    async supplies(filter: SuppliesReportFilter): Promise<SuppliesReport> {
      await delay()
      const mode = scenarioFor(scenario, 'supplies')
      if (mode === 'error') fail()
      const meta = { ...range(filter), page: filter.page ?? 1, pageSize: filter.pageSize ?? 25 }
      if (mode === 'empty') return { ...meta, total: 0, hasMore: false, rows: [] }
      return {
        ...meta,
        total: 3,
        hasMore: false,
        rows: [
          { name: 'CS-2026-0143', postingDate: '2026-09-14', supplier: 'SUP-0001', supplierName: 'مصنع النور للكرتون', item: 'CARD-DUPLEX-300', itemName: 'كرتون دوبلكس 300 جرام', payableWeight: 5120, value: 33280, status: 'Submitted' },
          { name: 'CS-2026-0142', postingDate: '2026-09-14', supplier: 'SUP-0002', supplierName: 'مؤسسة الشروق لتجميع الكرتون', item: 'CARD-KRAFT-120', itemName: 'كرتون كرافت 120 جرام', payableWeight: 1830, value: 9150, status: 'Submitted' },
          { name: 'CS-2026-0141', postingDate: '2026-09-13', supplier: 'SUP-0001', supplierName: 'مصنع النور للكرتون', item: 'CARD-WHITE-250', itemName: 'كرتون أبيض مطبوع 250 جرام', payableWeight: 7400, value: 55500, status: 'Draft' },
        ],
      }
    },
    async sales(filter: SalesReportFilter): Promise<SalesReport> {
      await delay()
      const mode = scenarioFor(scenario, 'sales')
      if (mode === 'error') fail()
      const meta = { ...range(filter), page: filter.page ?? 1, pageSize: filter.pageSize ?? 25 }
      if (mode === 'empty') return { ...meta, total: 0, hasMore: false, rows: [] }
      return {
        ...meta,
        total: 2,
        hasMore: false,
        rows: [
          { name: 'SALE-2026-0068', postingDate: '2026-09-14', buyerName: 'شركة الأمل للتعبئة والتغليف', item: 'CARD-DUPLEX-300', itemName: 'كرتون دوبلكس 300 جرام', quantity: 1250, informationalValue: 16500, status: 'Submitted' },
          { name: 'SALE-2026-0067', postingDate: '2026-09-14', buyerName: 'مطبعة الدلتا', item: 'CARD-KRAFT-120', itemName: 'كرتون كرافت 120 جرام', quantity: 600, informationalValue: 7650, status: 'Submitted' },
        ],
      }
    },
  }
}
