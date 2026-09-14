import type { ReportDefinition } from './report-registry'

export type ReportDatePreset = 'today' | 'yesterday' | 'this-week' | 'this-month' | 'previous-month'

export interface ReportFilters {
  fromDate?: string
  toDate?: string
  supplier?: string
  cardboardType?: string
}

export interface ReportFilterField {
  key: 'fromDate' | 'toDate' | 'supplier'
  label: string
  required?: boolean
}

/** Local calendar fields, never toISOString(): UTC serialization can shift the
 *  operator's chosen day across a boundary. */
export const toIsoDate = (date: Date): string =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`

export function resolveReportDatePreset(preset: ReportDatePreset, today = new Date()): Pick<ReportFilters, 'fromDate' | 'toDate'> {
  const base = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  if (preset === 'today') return { fromDate: toIsoDate(base), toDate: toIsoDate(base) }
  if (preset === 'yesterday') {
    base.setDate(base.getDate() - 1)
    return { fromDate: toIsoDate(base), toDate: toIsoDate(base) }
  }
  if (preset === 'this-week') {
    base.setDate(base.getDate() - ((base.getDay() + 6) % 7))
    return { fromDate: toIsoDate(base), toDate: toIsoDate(today) }
  }
  if (preset === 'this-month') return { fromDate: toIsoDate(new Date(base.getFullYear(), base.getMonth(), 1)), toDate: toIsoDate(today) }
  return { fromDate: toIsoDate(new Date(base.getFullYear(), base.getMonth() - 1, 1)), toDate: toIsoDate(new Date(base.getFullYear(), base.getMonth(), 0)) }
}

export function reportFilterFields(definition: ReportDefinition): ReportFilterField[] {
  const fields: ReportFilterField[] = definition.supportsDateRange
    ? [
        { key: 'fromDate', label: definition.key === 'current-inventory' ? 'تاريخ اللقطة' : 'من تاريخ' },
        { key: 'toDate', label: 'إلى تاريخ' },
      ]
    : [{ key: 'toDate', label: 'تاريخ اللقطة' }]
  if (definition.requiresSupplier) fields.push({ key: 'supplier', label: 'المورد', required: true })
  return fields
}

export function canLoadReport(definition: ReportDefinition, filters: ReportFilters): boolean {
  return !definition.requiresSupplier || Boolean(filters.supplier)
}
