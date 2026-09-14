import { FrontendError } from '@/services/api/errors'
import type {
  ExpenseDetail,
  ExpenseInput,
  ExpenseListQuery,
  ExpenseOption,
  ExpenseService,
  InventoryService,
  Lookup,
  OperationalSettings,
  OperationalSettingsService,
  PaymentDetail,
  PaymentInput,
  PaymentListQuery,
  PaymentSchema,
  PaymentService,
  ReportingService,
  SaleDetail,
  SaleInput,
  SaleListQuery,
  SalesService,
  SessionService,
  SettingsLookups,
  SupplierDetail,
  SupplierListQuery,
  SupplierService,
  SupplierStatementEntry,
  SupplierStatementReport,
  SupplierSummary,
  SupplyDetail,
  SupplyInput,
  SupplyListQuery,
  SupplyService,
} from '@/services/contracts'
import {
  MOCK_TODAY,
  mockExpenses,
  mockInventory,
  mockOperationsSummary,
  mockPayments,
  mockSales,
  mockSettings,
  mockSupplierSummary,
  mockSuppliers,
  mockSupplies,
} from './dataset'

/**
 * Mock layer = the backend stand-in for `VITE_API_MODE=mock`.
 *
 * It answers every route's primary load path (list, detail, lookups, schema,
 * capabilities, lifecycle actions, reports) with deterministic fixtures, and it
 * honours the same filter/pagination shape as the real adapters so mock mode
 * cannot hide client-side filtering. Derived values (supply preview, scale
 * capture) are produced here *as the server would* — never by a component.
 */

const delay = (ms = 140) => new Promise((resolve) => setTimeout(resolve, ms))

const LOOKUP_ITEMS: Lookup[] = [
  { name: 'CARD-DUPLEX-300', label: 'كرتون دوبلكس 300 جرام' },
  { name: 'CARD-KRAFT-120', label: 'كرتون كرافت 120 جرام' },
  { name: 'CARD-WHITE-250', label: 'كرتون أبيض مطبوع 250 جرام' },
  { name: 'CARD-MIXED-BALE', label: 'بالات كرتون مخلوط' },
]

const LOOKUP_SUPPLIERS: Lookup[] = mockSuppliers
  .filter((supplier) => !supplier.disabled)
  .map((supplier) => ({ name: supplier.name, label: supplier.supplierName }))

const EXPENSE_CATEGORIES: ExpenseOption[] = [
  { name: '5120 - نقل وشحن', displayName: 'نقل وشحن' },
  { name: '5130 - صيانة', displayName: 'صيانة' },
  { name: '5140 - كهرباء ومياه', displayName: 'كهرباء ومياه' },
  { name: '5150 - أجور عمالة', displayName: 'أجور عمالة' },
]

const PAYMENT_SOURCES: ExpenseOption[] = [
  { name: '1110 - الخزينة', displayName: 'الخزينة' },
  { name: '1120 - البنك التجاري', displayName: 'البنك التجاري' },
]

const MODES_OF_PAYMENT = ['نقدي', 'تحويل بنكي', 'شيك']

function matches(haystack: Array<string | undefined>, needle?: string): boolean {
  if (!needle) return true
  const value = needle.trim().toLowerCase()
  if (!value) return true
  return haystack.some((part) => (part ?? '').toLowerCase().includes(value))
}

function inRange(date: string, from?: string, to?: string): boolean {
  if (from && date < from) return false
  if (to && date > to) return false
  return true
}

function paginate<T>(rows: T[], page = 1, pageSize = 25) {
  const safeSize = Math.min(Math.max(pageSize || 25, 1), 100)
  const safePage = Math.max(page || 1, 1)
  const start = (safePage - 1) * safeSize
  return {
    data: rows.slice(start, start + safeSize),
    page: safePage,
    pageSize: safeSize,
    total: rows.length,
    hasMore: start + safeSize < rows.length,
  }
}

function nextName(prefix: string, rows: Array<{ name: string }>): string {
  const highest = rows.reduce((max, row) => {
    const numeric = Number(row.name.split('-').pop())
    return Number.isFinite(numeric) && numeric > max ? numeric : max
  }, 0)
  return `${prefix}-${String(highest + 1).padStart(4, '0')}`
}

function required<T extends { name: string }>(rows: T[], name: string, message: string): T {
  const row = rows.find((item) => item.name === name)
  if (!row) throw new FrontendError('not_found', message, 404, 'not_found')
  return row
}

function printTicket(title: string, entries: Array<[string, string]>): { url: string; format: string } {
  const body = entries.map(([label, value]) => `<tr><th>${label}</th><td>${value}</td></tr>`).join('')
  const html =
    `<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><title>${title}</title>` +
    `<style>body{font-family:'Readex Pro',Tahoma,sans-serif;padding:24px}h2{margin:0 0 16px}` +
    `table{border-collapse:collapse;width:100%}th,td{border:1px solid #cbd5e1;padding:8px;text-align:right;font-size:14px}` +
    `th{background:#f1f5f9;width:35%}</style></head><body><h2>${title}</h2><table>${body}</table></body></html>`
  return { url: `data:text/html;charset=utf-8,${encodeURIComponent(html)}`, format: 'Cardboard Supply Ticket' }
}

/* ----------------------------------------------------------------- supplies */

const SUPPLY_DRAFT_CAPABILITIES: SupplyDetail['capabilities'] = {
  canEdit: true,
  canSubmit: true,
  canCancel: false,
  canCaptureGross: true,
  canCaptureTare: true,
  canPrint: true,
}

export function createMockSupplyService(): SupplyService {
  const rows = mockSupplies

  /** Fixture-only derivation; in real mode the backend owns these numbers. */
  const derive = (input: SupplyInput) => {
    const netWeight = Math.max(0, Number(input.grossWeight || 0) - Number(input.tareWeight || 0))
    const discountWeight =
      input.discountType === 'Kg'
        ? Number(input.discountValue || 0)
        : input.discountType === 'Percentage'
          ? (netWeight * Number(input.discountValue || 0)) / 100
          : 0
    const payableWeight = Math.max(0, netWeight - discountWeight)
    return {
      netWeight,
      discountWeight,
      payableWeight,
      displayPayableWeight: payableWeight,
      totalAmount: payableWeight * Number(input.ratePerKg || 0),
    }
  }

  const applyInput = (existing: SupplyDetail, input: SupplyInput): SupplyDetail => {
    const derived = derive(input)
    return {
      ...existing,
      postingDate: input.postingDate,
      supplier: input.supplier,
      supplierName: LOOKUP_SUPPLIERS.find((option) => option.name === input.supplier)?.label ?? input.supplier,
      item: input.item,
      itemName: LOOKUP_ITEMS.find((option) => option.name === input.item)?.label ?? input.item,
      grossWeight: Number(input.grossWeight || 0),
      tareWeight: Number(input.tareWeight || 0),
      ratePerKg: Number(input.ratePerKg || 0),
      discountType: input.discountType,
      discountValue: Number(input.discountValue || 0),
      netWeight: derived.netWeight,
      discountWeight: derived.discountWeight,
      payableWeight: derived.payableWeight,
      displayPayableWeight: derived.displayPayableWeight,
      totalAmount: derived.totalAmount,
      vehicleNo: input.vehicleNo,
      driverName: input.driverName,
      weightTicket: input.weightTicket,
      supplierReceipt: input.supplierReceipt,
      notes: input.notes,
    }
  }

  return {
    async list(query: SupplyListQuery = {}) {
      await delay()
      const filtered = rows.filter(
        (row) =>
          inRange(row.postingDate, query.dateFrom, query.dateTo) &&
          (!query.supplier || row.supplier === query.supplier) &&
          (!query.item || row.item === query.item) &&
          (!query.status || row.status === query.status) &&
          matches([row.name, row.supplierName, row.itemName], query.search),
      )
      return paginate(filtered, query.page, query.pageSize)
    },
    async get(name) {
      await delay()
      return required(rows, name, 'التوريدة المطلوبة غير موجودة.')
    },
    async lookupSuppliers(search) {
      await delay()
      return LOOKUP_SUPPLIERS.filter((option) => matches([option.name, option.label], search))
    },
    async lookupItems(search) {
      await delay()
      return LOOKUP_ITEMS.filter((option) => matches([option.name, option.label], search))
    },
    async getCreateCapabilities() {
      await delay()
      return { canCreate: true, canSubmit: true }
    },
    async preview(input) {
      await delay(60)
      return derive(input)
    },
    async create(input) {
      await delay()
      const created = applyInput(
        {
          name: nextName('CS-2026', rows),
          postingDate: input.postingDate,
          supplier: input.supplier,
          supplierName: '',
          item: input.item,
          itemName: '',
          payableWeight: 0,
          totalAmount: 0,
          status: 'Draft',
          docstatus: 0,
          warehouse: mockSettings.default_warehouse ?? '',
          grossWeight: 0,
          tareWeight: 0,
          netWeight: 0,
          discountType: input.discountType,
          discountValue: 0,
          discountWeight: 0,
          displayPayableWeight: 0,
          ratePerKg: 0,
          integrationStatus: 'Not generated',
          capabilities: { ...SUPPLY_DRAFT_CAPABILITIES },
        },
        input,
      )
      rows.unshift(created)
      return created
    },
    async update(name, input) {
      await delay()
      const index = rows.findIndex((row) => row.name === name)
      if (index < 0) throw new FrontendError('not_found', 'التوريدة المطلوبة غير موجودة.', 404, 'not_found')
      rows[index] = applyInput(rows[index], input)
      return rows[index]
    },
    async submit(name) {
      await delay()
      const row = required(rows, name, 'التوريدة المطلوبة غير موجودة.')
      row.status = 'Submitted'
      row.docstatus = 1
      row.paymentStatus = 'غير مدفوع'
      row.integrationStatus = 'Invoice created'
      row.capabilities = { ...row.capabilities, canEdit: false, canSubmit: false, canCancel: true }
      return row
    },
    async cancel(name) {
      await delay()
      const row = required(rows, name, 'التوريدة المطلوبة غير موجودة.')
      row.status = 'Cancelled'
      row.docstatus = 2
      row.capabilities = { ...row.capabilities, canEdit: false, canSubmit: false, canCancel: false, canCaptureGross: false, canCaptureTare: false }
      return row
    },
    async capture(name, field, weight) {
      await delay()
      const row = required(rows, name, 'التوريدة المطلوبة غير موجودة.')
      const captured = weight ?? (field === 'gross' ? 6280 : 1080)
      if (field === 'gross') row.grossWeight = captured
      else row.tareWeight = captured
      const derived = derive({
        postingDate: row.postingDate,
        supplier: row.supplier,
        item: row.item,
        grossWeight: row.grossWeight,
        tareWeight: row.tareWeight,
        ratePerKg: row.ratePerKg,
        discountType: row.discountType,
        discountValue: row.discountValue,
      })
      row.netWeight = derived.netWeight
      row.discountWeight = derived.discountWeight
      row.payableWeight = derived.payableWeight
      row.displayPayableWeight = derived.displayPayableWeight
      row.totalAmount = derived.totalAmount
      return row
    },
    async print(name) {
      await delay()
      const row = required(rows, name, 'التوريدة المطلوبة غير موجودة.')
      return printTicket(`كارتة توريدة ${row.name}`, [
        ['المورد', row.supplierName],
        ['نوع الكرتون', row.itemName],
        ['التاريخ', row.postingDate],
        ['الوزن القائم', `${row.grossWeight} كجم`],
        ['وزن السيارة', `${row.tareWeight} كجم`],
        ['الوزن المحتسب', `${row.displayPayableWeight} كجم`],
        ['القيمة', `${row.totalAmount} ج.م`],
        ['رقم السيارة', row.vehicleNo ?? '—'],
      ])
    },
  }
}

/* -------------------------------------------------------------------- sales */

export function createMockSalesService(): SalesService {
  const rows = mockSales

  const applyInput = (existing: SaleDetail, input: SaleInput): SaleDetail => ({
    ...existing,
    postingDate: input.postingDate,
    item: input.item,
    itemName: LOOKUP_ITEMS.find((option) => option.name === input.item)?.label ?? input.item,
    quantity: Number(input.quantity || 0),
    ratePerKg: Number(input.ratePerKg || 0),
    buyerName: input.buyerName,
    notes: input.notes,
    // Fixture-only: the backend returns the operational value in real mode.
    informationalValue: Number(input.quantity || 0) * Number(input.ratePerKg || 0),
  })

  return {
    async list(query: SaleListQuery = {}) {
      await delay()
      const filtered = rows.filter(
        (row) =>
          inRange(row.postingDate, query.fromDate, query.toDate) &&
          (!query.item || row.item === query.item) &&
          matches([row.buyerName], query.buyer) &&
          (!query.status || row.status === query.status) &&
          matches([row.name, row.buyerName, row.itemName], query.search),
      )
      return paginate(filtered, query.page, query.pageSize)
    },
    async get(name) {
      await delay()
      return required(rows, name, 'البيع المطلوب غير موجود.')
    },
    async lookupBuyers(search) {
      await delay()
      const unique = Array.from(new Set(rows.map((row) => row.buyerName).filter((value): value is string => Boolean(value))))
      return unique.filter((value) => matches([value], search))
    },
    async lookupItems(search) {
      await delay()
      return LOOKUP_ITEMS.filter((option) => matches([option.name, option.label], search))
    },
    async create(input) {
      await delay()
      const created: SaleDetail = applyInput(
        {
          name: nextName('SALE-2026', rows),
          postingDate: input.postingDate,
          item: input.item,
          itemName: '',
          quantity: 0,
          ratePerKg: 0,
          totalAmount: 0,
          informationalValue: 0,
          status: 'Draft',
          docstatus: 0,
          company: mockSettings.company ?? '',
          warehouse: mockSettings.default_warehouse ?? '',
          capabilities: { canEdit: true, canSubmit: true, canCancel: false },
        },
        input,
      )
      rows.unshift(created)
      return created
    },
    async update(name, input) {
      await delay()
      const index = rows.findIndex((row) => row.name === name)
      if (index < 0) throw new FrontendError('not_found', 'البيع المطلوب غير موجود.', 404, 'not_found')
      rows[index] = applyInput(rows[index], input)
      return rows[index]
    },
    async submit(name) {
      await delay()
      const row = required(rows, name, 'البيع المطلوب غير موجود.')
      row.status = 'Submitted'
      row.docstatus = 1
      row.stockEntry = `MAT-STE-2026-${String(312 + rows.indexOf(row)).padStart(5, '0')}`
      row.capabilities = { canEdit: false, canSubmit: false, canCancel: true }
      return row
    },
    async cancel(name) {
      await delay()
      const row = required(rows, name, 'البيع المطلوب غير موجود.')
      row.status = 'Cancelled'
      row.docstatus = 2
      row.capabilities = { canEdit: false, canSubmit: false, canCancel: false }
      return row
    },
    async getCreateCapabilities() {
      await delay()
      return { canCreate: true, canSubmit: true }
    },
    async getCapabilities(name) {
      await delay()
      return required(rows, name, 'البيع المطلوب غير موجود.').capabilities
    },
    async formAction(name) {
      await delay()
      return { url: `/app/cardboard-sale/${name}`, deskRoute: 'cardboard-sale', query: `name=${name}` }
    },
  }
}

/* ---------------------------------------------------------------- suppliers */

export function createMockSupplierService(): SupplierService {
  const rows = mockSuppliers
  return {
    async list(query: SupplierListQuery = {}) {
      await delay()
      const filtered = rows.filter(
        (row) =>
          matches([row.name, row.supplierName], query.search) &&
          (query.status === undefined ? true : query.status === 'disabled' ? row.disabled : !row.disabled),
      )
      return paginate(filtered, query.page, query.pageSize)
    },
    async get(name) {
      await delay()
      return required(rows, name, 'المورد المطلوب غير موجود.')
    },
    async schema() {
      await delay()
      return {
        requiredFields: ['supplier_name'],
        optionalFields: ['supplier_type', 'tax_id', 'supplier_details'],
        readOnlyFields: ['name', 'supplier_group', 'disabled'],
        defaultSupplierGroup: 'جامعو الخردة',
        supplierTypeDefault: 'Company' as const,
      }
    },
    async create(input) {
      await delay()
      const created: SupplierDetail = {
        name: nextName('SUP', rows),
        supplierName: input.supplierName,
        supplierGroup: 'جامعو الخردة',
        disabled: false,
        supplierType: input.supplierType ?? 'Company',
        taxId: input.taxId,
        supplierDetails: input.supplierDetails,
        capabilities: { canRead: true, canCreate: true, canEdit: false as const },
      }
      rows.unshift(created)
      return created
    },
    async update(name, input) {
      await delay()
      const row = required(rows, name, 'المورد المطلوب غير موجود.')
      const updated: SupplierDetail = {
        ...row,
        supplierName: input.supplierName,
        supplierType: input.supplierType ?? row.supplierType,
        taxId: input.taxId,
        supplierDetails: input.supplierDetails,
      }
      Object.assign(row, updated)
      return updated
    },
    async capabilities(name) {
      await delay()
      if (name) return { capabilities: required(rows, name, 'المورد المطلوب غير موجود.').capabilities }
      return { capabilities: { canRead: true, canCreate: true, canEdit: true } }
    },
    async summary(name): Promise<SupplierSummary> {
      await delay()
      const row = required(rows, name, 'المورد المطلوب غير موجود.')
      return { ...mockSupplierSummary, supplier: row, outstanding: row.name === 'SUP-0001' ? 27280 : 9150 }
    },
    async statement(name, _fromDate, toDate, page = 1, pageSize = 200): Promise<SupplierStatementReport> {
      await delay()
      const row = required(rows, name, 'المورد المطلوب غير موجود.')
      const summary = { ...mockSupplierSummary, supplier: row, outstanding: row.name === 'SUP-0001' ? 27280 : 9150 }
      const entries: SupplierStatementEntry[] = [
        ...summary.supplyHistory.map((item) => ({
          type: 'supply' as const,
          name: item.supply,
          postingDate: item.postingDate,
          label: item.itemName,
          quantity: item.payableWeight,
          amount: item.value,
        })),
        ...summary.paymentHistory.map((item) => ({
          type: 'payment' as const,
          name: item.payment,
          postingDate: item.postingDate,
          label: item.modeOfPayment ?? 'دفعة مورد',
          amount: item.amount,
          modeOfPayment: item.modeOfPayment,
        })),
      ].sort((left, right) => (left.postingDate < right.postingDate ? 1 : -1))

      const start = Math.max(page, 1)
      const size = Math.min(pageSize || 200, 500)
      const window = entries.slice((start - 1) * size, start * size)

      return {
        supplier: { name: row.name, nameLabel: row.supplierName },
        fromDate: summary.fromDate,
        toDate: toDate ?? summary.toDate,
        supplyCount: summary.supplyCount,
        suppliedPayableWeight: summary.suppliedPayableWeight,
        suppliedValue: summary.supplyValue,
        paidAmount: summary.supplierPayments,
        currentOutstanding: summary.outstanding,
        submittedOnly: summary.submittedOnly,
        entries: window,
        page: start,
        pageSize: size,
        total: entries.length,
        hasMore: start * size < entries.length,
      }
    },
  }
}

/* ----------------------------------------------------------------- payments */

export function createMockPaymentService(): PaymentService {
  const rows = mockPayments

  const applyInput = (existing: PaymentDetail, input: PaymentInput): PaymentDetail => ({
    ...existing,
    postingDate: input.postingDate,
    supplier: input.supplier,
    supplierName: mockSuppliers.find((supplier) => supplier.name === input.supplier)?.supplierName ?? input.supplier,
    amount: Number(input.amount || 0),
    modeOfPayment: input.modeOfPayment,
    referenceNo: input.referenceNo,
    referenceDate: input.referenceDate,
    notes: input.notes,
  })

  return {
    async list(query: PaymentListQuery = {}) {
      await delay()
      const filtered = rows.filter(
        (row) =>
          inRange(row.postingDate, query.fromDate, query.toDate) &&
          (!query.supplier || row.supplier === query.supplier) &&
          (!query.modeOfPayment || row.modeOfPayment === query.modeOfPayment) &&
          (!query.status || row.status === query.status) &&
          matches([row.name, row.supplierName, row.modeOfPayment], query.search),
      )
      return paginate(filtered, query.page, query.pageSize)
    },
    async get(name) {
      await delay()
      return required(rows, name, 'الدفعة المطلوبة غير موجودة.')
    },
    async lookupSuppliers(search) {
      await delay()
      return mockSuppliers
        .filter((supplier) => !supplier.disabled)
        .filter((supplier) => matches([supplier.name, supplier.supplierName], search))
        .map((supplier) => ({ supplier: supplier.name, supplierName: supplier.supplierName, disabled: supplier.disabled }))
    },
    async lookupModes(search) {
      await delay()
      return MODES_OF_PAYMENT.filter((mode) => matches([mode], search))
    },
    async schema(): Promise<PaymentSchema> {
      await delay()
      return { defaultPostingDate: MOCK_TODAY, defaultModeOfPayment: 'نقدي', capabilities: { canCreate: true } }
    },
    async context(supplier) {
      await delay()
      return { company: mockSettings.company, currentSupplierOutstanding: supplier === 'SUP-0001' ? 27280 : 9150 }
    },
    async create(input) {
      await delay()
      const created: PaymentDetail = applyInput(
        {
          name: nextName('CSP-2026', rows),
          postingDate: input.postingDate,
          supplier: input.supplier,
          supplierName: '',
          amount: 0,
          modeOfPayment: input.modeOfPayment,
          status: 'Draft',
          docstatus: 0,
          paymentStatus: 'لم يُنشأ بعد',
          capabilities: { canRead: true, canEdit: true, canSubmit: true, canCancel: false },
        },
        input,
      )
      rows.unshift(created)
      return created
    },
    async update(name, input) {
      await delay()
      const index = rows.findIndex((row) => row.name === name)
      if (index < 0) throw new FrontendError('not_found', 'الدفعة المطلوبة غير موجودة.', 404, 'not_found')
      rows[index] = applyInput(rows[index], input)
      return rows[index]
    },
    async submit(name) {
      await delay()
      const row = required(rows, name, 'الدفعة المطلوبة غير موجودة.')
      row.status = 'Submitted'
      row.docstatus = 1
      row.paymentStatus = 'معتمد'
      row.capabilities = { canRead: true, canEdit: false, canSubmit: false, canCancel: true }
      return row
    },
    async cancel(name) {
      await delay()
      const row = required(rows, name, 'الدفعة المطلوبة غير موجودة.')
      row.status = 'Cancelled'
      row.docstatus = 2
      row.paymentStatus = 'ملغي'
      row.capabilities = { canRead: true, canEdit: false, canSubmit: false, canCancel: false }
      return row
    },
  }
}

/* ----------------------------------------------------------------- expenses */

export function createMockExpenseService(): ExpenseService {
  const rows = mockExpenses

  const applyInput = (existing: ExpenseDetail, input: ExpenseInput): ExpenseDetail => ({
    ...existing,
    postingDate: input.postingDate,
    expenseCategory: input.expenseCategory,
    expenseCategoryName: EXPENSE_CATEGORIES.find((option) => option.name === input.expenseCategory)?.displayName ?? input.expenseCategory,
    amount: Number(input.amount || 0),
    paymentSource: input.paymentSource,
    paymentSourceName: PAYMENT_SOURCES.find((option) => option.name === input.paymentSource)?.displayName ?? input.paymentSource,
    paymentMode: input.paymentMode,
    description: input.description,
    referenceNo: input.referenceNo,
    referenceDate: input.referenceDate,
    supplierOrParty: input.supplierOrParty,
  })

  return {
    async list(query: ExpenseListQuery = {}) {
      await delay()
      const filtered = rows.filter(
        (row) =>
          inRange(row.postingDate, query.fromDate, query.toDate) &&
          (!query.expenseCategory || row.expenseCategory === query.expenseCategory) &&
          (!query.status || row.status === query.status) &&
          matches([row.name, row.expenseCategoryName, row.description], query.search),
      )
      return paginate(filtered, query.page, query.pageSize)
    },
    async get(name) {
      await delay()
      return required(rows, name, 'المصروف المطلوب غير موجود.')
    },
    async categories() {
      await delay()
      return EXPENSE_CATEGORIES
    },
    async sources() {
      await delay()
      return PAYMENT_SOURCES
    },
    async schema() {
      await delay()
      return {
        defaultPostingDate: MOCK_TODAY,
        requiredFields: ['posting_date', 'expense_category', 'amount', 'payment_source'],
        optionalFields: ['payment_mode', 'supplier_or_party', 'description', 'attachment', 'reference_no'],
        capabilities: { canCreate: true },
      }
    },
    async create(input) {
      await delay()
      const created: ExpenseDetail = applyInput(
        {
          name: nextName('EXP-2026', rows),
          postingDate: input.postingDate,
          expenseCategory: input.expenseCategory,
          expenseCategoryName: '',
          amount: 0,
          paymentSource: input.paymentSource,
          paymentSourceName: '',
          paymentMode: input.paymentMode,
          status: 'Draft',
          docstatus: 0,
          accountingStatus: 'لم يُرحّل بعد',
          capabilities: { canRead: true, canEdit: true, canSubmit: true, canCancel: false },
        },
        input,
      )
      rows.unshift(created)
      return created
    },
    async update(name, input) {
      await delay()
      const index = rows.findIndex((row) => row.name === name)
      if (index < 0) throw new FrontendError('not_found', 'المصروف المطلوب غير موجود.', 404, 'not_found')
      rows[index] = applyInput(rows[index], input)
      return rows[index]
    },
    async submit(name) {
      await delay()
      const row = required(rows, name, 'المصروف المطلوب غير موجود.')
      row.status = 'Submitted'
      row.docstatus = 1
      row.accountingStatus = 'تم ترحيل قيد اليومية'
      row.capabilities = { canRead: true, canEdit: false, canSubmit: false, canCancel: true }
      return row
    },
    async cancel(name) {
      await delay()
      const row = required(rows, name, 'المصروف المطلوب غير موجود.')
      row.status = 'Cancelled'
      row.docstatus = 2
      row.accountingStatus = 'ملغي'
      row.capabilities = { canRead: true, canEdit: false, canSubmit: false, canCancel: false }
      return row
    },
  }
}

/* ---------------------------------------------------------------- inventory */

export function createMockInventoryService(): InventoryService {
  return {
    async getOverview(request) {
      await delay()
      const selectedDate = request.selectedDate ?? MOCK_TODAY
      const rows = request.itemCode ? mockInventory.rows.filter((row) => row.itemCode === request.itemCode) : mockInventory.rows
      // Fixture-only aggregation, mirroring the authoritative server summary.
      const quantity = rows.reduce((sum, row) => sum + row.quantity, 0)
      const stockValue = rows.reduce((sum, row) => sum + row.stockValue, 0)
      return {
        ...mockInventory,
        state: rows.length ? ('ok' as const) : ('no_stock' as const),
        selectedDate,
        isToday: selectedDate === MOCK_TODAY,
        rows,
        summary: { quantity: rows.length ? quantity : null, uom: rows.length ? 'Kg' : null, stockValue },
      }
    },
  }
}

/* ---------------------------------------------------------------- reporting */

export function createMockReportingService(): ReportingService {
  return {
    async getOperationsSummary(request) {
      await delay()
      return { ...mockOperationsSummary, fromDate: request.fromDate ?? MOCK_TODAY, toDate: request.toDate ?? MOCK_TODAY }
    },
  }
}

/* ----------------------------------------------------------------- settings */

export function createMockSettingsService(canEdit = true): OperationalSettingsService {
  const lookups: SettingsLookups = {
    companies: [
      { name: 'Cardboard Recycling', displayName: 'Cardboard Recycling' },
      { name: 'Delta Paper Trading', displayName: 'Delta Paper Trading' },
    ],
    warehouses: [
      { name: 'مخزن الكرتون الرئيسي — الرئيسية', displayName: 'مخزن الكرتون الرئيسي' },
      { name: 'مخزن الفرز — الرئيسية', displayName: 'مخزن الفرز' },
    ],
    itemGroups: [
      { name: 'مواد الكرتون', displayName: 'مواد الكرتون' },
      { name: 'مواد الكرتون - دوبلكس', displayName: 'مواد الكرتون - دوبلكس' },
    ],
    supplierGroups: [
      { name: 'جامعو الخردة', displayName: 'جامعو الخردة' },
      { name: 'الموردون المحليون', displayName: 'الموردون المحليون' },
    ],
    modesOfPayment: MODES_OF_PAYMENT.map((mode) => ({ name: mode, displayName: mode })),
  }

  return {
    async get(): Promise<OperationalSettings> {
      await delay()
      return { ...mockSettings, capabilities: { can_read: true, can_edit: canEdit } }
    },
    async save(input) {
      await delay()
      return { ...mockSettings, ...input, capabilities: { can_read: true, can_edit: true } }
    },
    async lookups(): Promise<SettingsLookups> {
      await delay()
      return lookups
    },
  }
}

/* ------------------------------------------------------------------ session */

export function createMockSessionService(): SessionService {
  return {
    async context() {
      await delay(40)
      return { user: 'أحمد المصري' }
    },
  }
}

export { EXPENSE_CATEGORIES, LOOKUP_ITEMS, MODES_OF_PAYMENT, PAYMENT_SOURCES }
