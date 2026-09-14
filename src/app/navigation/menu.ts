import type { IconName } from '@/components/base/icons'

export interface MenuItem {
  area: string
  label: string
  to: string
  icon: IconName
}

export interface MenuGroup {
  key: string
  label: string
  items: readonly MenuItem[]
}

/** Frozen product navigation: one configuration drives the rail, the drawer and
 *  the mobile action bar. */
export const primaryMenu: readonly MenuItem[] = [
  { area: 'home', label: 'الرئيسية', to: '/', icon: 'home' },
  { area: 'supplies', label: 'التوريدات', to: '/supplies', icon: 'inbound' },
  { area: 'sales', label: 'المبيعات', to: '/sales', icon: 'outbound' },
  { area: 'inventory', label: 'المخزون', to: '/inventory', icon: 'inventory' },
]

export const secondaryMenu: readonly MenuItem[] = [
  { area: 'suppliers', label: 'الموردون', to: '/suppliers', icon: 'suppliers' },
  { area: 'payments', label: 'المدفوعات', to: '/payments', icon: 'payments' },
  { area: 'expenses', label: 'المصروفات', to: '/expenses', icon: 'expenses' },
  { area: 'reports', label: 'التقارير', to: '/reports', icon: 'reports' },
]

export const menuGroups: readonly MenuGroup[] = [
  { key: 'operations', label: 'التشغيل', items: primaryMenu },
  { key: 'records', label: 'السجلات والتقارير', items: secondaryMenu },
]

export const settingsMenu: MenuItem = { area: 'settings', label: 'الإعدادات', to: '/settings', icon: 'settings' }

export const quickActions: readonly MenuItem[] = [
  { area: 'supply-new', label: 'توريدة جديدة', to: '/supplies/new', icon: 'inbound' },
  { area: 'sale-new', label: 'بيع جديد', to: '/sales/new', icon: 'outbound' },
  { area: 'payment-new', label: 'دفعة مورد جديدة', to: '/payments/new', icon: 'payments' },
  { area: 'expense-new', label: 'مصروف جديد', to: '/expenses/new', icon: 'expenses' },
]

export const mobileMenu: readonly MenuItem[] = [
  { area: 'home', label: 'الرئيسية', to: '/', icon: 'home' },
  { area: 'supplies', label: 'التوريدات', to: '/supplies', icon: 'inbound' },
  { area: 'sales', label: 'المبيعات', to: '/sales', icon: 'outbound' },
  { area: 'reports', label: 'التقارير', to: '/reports', icon: 'reports' },
]

/** Path-prefix matching so creation/detail child routes keep their area active. */
export function isAreaActive(path: string, item: Pick<MenuItem, 'to'>): boolean {
  if (item.to === '/') return path === '/'
  return path === item.to || path.startsWith(`${item.to}/`)
}
