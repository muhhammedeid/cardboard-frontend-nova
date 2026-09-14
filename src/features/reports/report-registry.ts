import type { IconName } from '@/components/base/icons'

export type ReportKey =
  | 'operations-summary'
  | 'current-inventory'
  | 'inventory-movement'
  | 'supplier-summary'
  | 'supplier-statement'
  | 'expense-summary'
  | 'supplies'
  | 'sales'

export type ReportHubGroupKey = 'operations' | 'suppliers' | 'expenses' | 'commerce'

export interface ReportDefinition {
  key: ReportKey
  title: string
  description: string
  hubGroup: ReportHubGroupKey
  icon: IconName
  requiresSupplier?: boolean
  supportsDateRange: boolean
}

export interface ReportHubGroup {
  key: ReportHubGroupKey
  title: string
  description: string
  reportKeys: readonly ReportKey[]
}

/**
 * Single source of truth for report identity: card key, title, description and
 * route path all come from here, and the app shell resolves report routes
 * through the same registry so headers can never drift from the renderer key.
 */
export const reportDefinitions: readonly ReportDefinition[] = [
  {
    key: 'operations-summary',
    title: 'ملخص العمليات',
    description: 'التوريدات والمبيعات والمدفوعات والمصروفات خلال الفترة.',
    hubGroup: 'operations',
    icon: 'gauge',
    supportsDateRange: true,
  },
  {
    key: 'current-inventory',
    title: 'رصيد المخزون',
    description: 'لقطة الرصيد المعتمدة للمخزون في تاريخ محدد.',
    hubGroup: 'operations',
    icon: 'inventory',
    supportsDateRange: false,
  },
  {
    key: 'inventory-movement',
    title: 'حركة المخزون',
    description: 'الوارد والصادر خلال الفترة؛ ليست رصيدًا.',
    hubGroup: 'operations',
    icon: 'reports',
    supportsDateRange: true,
  },
  {
    key: 'supplier-summary',
    title: 'ملخص الموردين',
    description: 'مؤشرات فترة المورد ورصيده المستحق الحالي.',
    hubGroup: 'suppliers',
    icon: 'suppliers',
    requiresSupplier: true,
    supportsDateRange: true,
  },
  {
    key: 'supplier-statement',
    title: 'كشف حساب المورد',
    description: 'توريدات ومدفوعات المورد المعتمدة.',
    hubGroup: 'suppliers',
    icon: 'layers',
    requiresSupplier: true,
    supportsDateRange: true,
  },
  {
    key: 'expense-summary',
    title: 'ملخص المصروفات',
    description: 'الإجمالي والتوزيع حسب الفئة.',
    hubGroup: 'expenses',
    icon: 'expenses',
    supportsDateRange: true,
  },
  {
    key: 'supplies',
    title: 'تقرير التوريدات',
    description: 'التوريدات والوزن المحتسب والقيمة.',
    hubGroup: 'commerce',
    icon: 'inbound',
    supportsDateRange: true,
  },
  {
    key: 'sales',
    title: 'تقرير المبيعات',
    description: 'الكميات والقيمة التشغيلية.',
    hubGroup: 'commerce',
    icon: 'outbound',
    supportsDateRange: true,
  },
]

export const reportHubGroups: readonly ReportHubGroup[] = [
  { key: 'operations', title: 'التشغيل', description: 'مؤشرات المخزون والتشغيل اليومي.', reportKeys: ['operations-summary', 'current-inventory', 'inventory-movement'] },
  { key: 'suppliers', title: 'الموردون والمدفوعات', description: 'ملخص المورد وكشف حسابه.', reportKeys: ['supplier-summary', 'supplier-statement'] },
  { key: 'expenses', title: 'المصروفات', description: 'إجمالي المصروفات وتوزيعها.', reportKeys: ['expense-summary'] },
  { key: 'commerce', title: 'الحركة التجارية', description: 'تقارير التوريدات والمبيعات التفصيلية.', reportKeys: ['supplies', 'sales'] },
]

export function findReportDefinition(key: string): ReportDefinition | undefined {
  return reportDefinitions.find((definition) => definition.key === key)
}

export function reportsForHubGroup(group: ReportHubGroup): readonly ReportDefinition[] {
  return group.reportKeys.map((key) => findReportDefinition(key)).filter((definition): definition is ReportDefinition => Boolean(definition))
}
