import type { RpcTransport } from '@/services/api/frappe-rpc'
import type { OperationsSummary, OperationsSummaryRequest, ReportingService } from '@/services/contracts'

interface RawOperationsSummary {
  from_date: string
  to_date: string
  supplies: { count: number; quantity: number; payable_weight: number; value: number }
  sales: { count: number; quantity: number; value: number }
  supplier_payments: { count: number; amount: number }
  expenses: { count: number; amount: number }
}

export function createReportingService(transport: RpcTransport): ReportingService {
  return {
    async getOperationsSummary(request: OperationsSummaryRequest): Promise<OperationsSummary> {
      const raw = await transport.call<RawOperationsSummary>('cardboard_management.reporting.get_operations_summary', {
        from_date: request.fromDate,
        to_date: request.toDate,
        cardboard_item: request.cardboardItem,
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
        sales: { count: raw.sales.count, quantity: raw.sales.quantity, value: raw.sales.value },
        supplierPayments: raw.supplier_payments,
        expenses: raw.expenses,
      }
    },
  }
}
