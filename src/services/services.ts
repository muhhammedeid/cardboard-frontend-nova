import type { FrontendConfig } from '@/app/bootstrap/config'
import { FrappeRpcTransport } from './api/frappe-rpc'
import type {
  ExpenseService,
  InventoryService,
  OperationalSettingsService,
  PaymentService,
  ReportingService,
  SalesService,
  SessionService,
  SupplierService,
  SupplyService,
} from './contracts'
import type { ReportService } from './contracts/reports'
import { createInventoryService } from './real/inventory'
import { createReportService } from './real/reports'
import { createReportingService } from './real/reporting'
import { createExpenseService } from './real/expense'
import { createPaymentService } from './real/payment'
import { createSalesService } from './real/sales'
import { createSettingsService } from './real/settings'
import { createSupplierService } from './real/supplier'
import { createSupplyService } from './real/supply'
import { createMockReportService } from './mocks/reports'
import {
  createMockExpenseService,
  createMockInventoryService,
  createMockPaymentService,
  createMockReportingService,
  createMockSalesService,
  createMockSessionService,
  createMockSettingsService,
  createMockSupplierService,
  createMockSupplyService,
} from './mocks/services'

/** The single composition root every screen consumes. */
export interface FrontendServices {
  inventory: InventoryService
  reporting: ReportingService
  reports: ReportService
  supplies: SupplyService
  sales: SalesService
  suppliers: SupplierService
  payments: PaymentService
  expenses: ExpenseService
  settings: OperationalSettingsService
  session: SessionService
}

export function createReportServiceFor(config: Pick<FrontendConfig, 'apiMode' | 'apiBaseUrl'>): ReportService {
  return config.apiMode === 'mock' ? createMockReportService() : createReportService(new FrappeRpcTransport(config.apiBaseUrl))
}

export function createServices(config: Pick<FrontendConfig, 'apiMode' | 'apiBaseUrl'>): FrontendServices {
  if (config.apiMode === 'mock') {
    return {
      inventory: createMockInventoryService(),
      reporting: createMockReportingService(),
      reports: createMockReportService(),
      supplies: createMockSupplyService(),
      sales: createMockSalesService(),
      suppliers: createMockSupplierService(),
      payments: createMockPaymentService(),
      expenses: createMockExpenseService(),
      settings: createMockSettingsService(),
      session: createMockSessionService(),
    }
  }

  const transport = new FrappeRpcTransport(config.apiBaseUrl)
  return {
    inventory: createInventoryService(transport),
    reporting: createReportingService(transport),
    reports: createReportService(transport),
    supplies: createSupplyService(transport),
    sales: createSalesService(transport),
    suppliers: createSupplierService(transport),
    payments: createPaymentService(transport),
    expenses: createExpenseService(transport),
    settings: createSettingsService(transport),
    session: {
      async context() {
        const context = await transport.sessionContext()
        return { user: context.user }
      },
    } satisfies SessionService,
  }
}
