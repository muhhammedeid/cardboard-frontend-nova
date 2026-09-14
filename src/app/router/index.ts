import { createRouter, createMemoryHistory, createWebHistory, type RouteRecordRaw } from 'vue-router'

import HomePage from '@/features/home/HomePage.vue'
import { SalesListPage, SaleFormPage, SaleDetailPage } from '@/features/sales'
import { SupplyDetailPage, SupplyFormPage, SupplyListPage } from '@/features/supplies'
import { SupplierListPage, SupplierFormPage, SupplierDetailPage } from '@/features/suppliers'
import { PaymentListPage, PaymentFormPage, PaymentDetailPage } from '@/features/payments'
import { ExpenseListPage, ExpenseFormPage, ExpenseDetailPage } from '@/features/expenses'
import { InventoryPage } from '@/features/inventory'
import MovementPage from '@/features/inventory/MovementPage.vue'
import { SettingsPage } from '@/features/settings'
import { ReportsHubPage } from '@/features/reports'
import ReportRoutePage from '@/features/reports/ReportRoutePage.vue'

/**
 * Route table is identical to the previous frontend (same paths, same names) so
 * a cutover needs no changes to bookmarks, entry links, or Frappe integrations.
 */
export const routes: RouteRecordRaw[] = [
  { path: '/', name: 'home', component: HomePage, meta: { label: 'الرئيسية', subtitle: 'ملخص التشغيل اليومي', area: 'home' } },

  { path: '/supplies', name: 'supplies', component: SupplyListPage, meta: { label: 'التوريدات', subtitle: 'توريدات الكرتون والوزن المحتسب', area: 'supplies' } },
  { path: '/supplies/new', name: 'supply-new', component: SupplyFormPage, meta: { label: 'توريدة جديدة', subtitle: 'تسجيل توريدة ومتابعة الأوزان', area: 'supplies' } },
  { path: '/supplies/:id', name: 'supply-detail', component: SupplyDetailPage, meta: { label: 'تفاصيل التوريدة', area: 'supplies' } },
  { path: '/supplies/:id/edit', name: 'supply-edit', component: SupplyFormPage, meta: { label: 'تحرير توريدة', subtitle: 'تعديل مسودة التوريدة', area: 'supplies' } },

  { path: '/sales', name: 'sales', component: SalesListPage, meta: { label: 'المبيعات', subtitle: 'الكميات والقيمة التشغيلية', area: 'sales' } },
  { path: '/sales/new', name: 'sale-new', component: SaleFormPage, meta: { label: 'بيع جديد', subtitle: 'تسجيل بيع وخفض المخزون', area: 'sales' } },
  { path: '/sales/:id', name: 'sale-detail', component: SaleDetailPage, meta: { label: 'تفاصيل البيع', area: 'sales' } },
  { path: '/sales/:id/edit', name: 'sale-edit', component: SaleFormPage, meta: { label: 'تحرير بيع', subtitle: 'تعديل مسودة البيع', area: 'sales' } },

  { path: '/suppliers', name: 'suppliers', component: SupplierListPage, meta: { label: 'الموردون', subtitle: 'ملفات الموردين وأرصدتهم', area: 'suppliers' } },
  { path: '/suppliers/new', name: 'supplier-new', component: SupplierFormPage, meta: { label: 'مورد جديد', subtitle: 'إنشاء ملف مورد', area: 'suppliers' } },
  { path: '/suppliers/:id', name: 'supplier-detail', component: SupplierDetailPage, meta: { label: 'ملف المورد', area: 'suppliers' } },

  { path: '/payments', name: 'payments', component: PaymentListPage, meta: { label: 'المدفوعات', subtitle: 'دفعات الموردين وحالتها', area: 'payments' } },
  { path: '/payments/new', name: 'payment-new', component: PaymentFormPage, meta: { label: 'دفعة مورد جديدة', subtitle: 'تسجيل دفعة على حساب مورد', area: 'payments' } },
  { path: '/payments/:id', name: 'payment-detail', component: PaymentDetailPage, meta: { label: 'تفاصيل الدفعة', area: 'payments' } },
  { path: '/payments/:id/edit', name: 'payment-edit', component: PaymentFormPage, meta: { label: 'تحرير دفعة', subtitle: 'تعديل مسودة الدفعة', area: 'payments' } },

  { path: '/expenses', name: 'expenses', component: ExpenseListPage, meta: { label: 'المصروفات', subtitle: 'المصروفات التشغيلية وحالتها المحاسبية', area: 'expenses' } },
  { path: '/expenses/new', name: 'expense-new', component: ExpenseFormPage, meta: { label: 'مصروف جديد', subtitle: 'تسجيل مصروف تشغيلي', area: 'expenses' } },
  { path: '/expenses/:id', name: 'expense-detail', component: ExpenseDetailPage, meta: { label: 'تفاصيل المصروف', area: 'expenses' } },
  { path: '/expenses/:id/edit', name: 'expense-edit', component: ExpenseFormPage, meta: { label: 'تحرير مصروف', subtitle: 'تعديل مسودة المصروف', area: 'expenses' } },

  { path: '/inventory', name: 'inventory', component: InventoryPage, meta: { label: 'المخزون', subtitle: 'الرصيد المعتمد من الخادم', area: 'inventory' } },
  { path: '/inventory/history', name: 'inventory-history', component: InventoryPage, meta: { label: 'الرصيد التاريخي', subtitle: 'رصيد نهاية اليوم المختار', area: 'inventory' } },
  { path: '/inventory/movement', name: 'inventory-movement', component: MovementPage, meta: { label: 'حركة المخزون', subtitle: 'الوارد والصادر خلال الفترة', area: 'inventory' } },

  { path: '/reports', name: 'reports', component: ReportsHubPage, meta: { label: 'التقارير', subtitle: 'تقارير تشغيلية معتمدة من الخادم', area: 'reports' } },
  { path: '/reports/:reportKey', name: 'report-detail', component: ReportRoutePage, meta: { label: 'تقرير', area: 'reports' } },

  { path: '/settings', name: 'settings', component: SettingsPage, meta: { label: 'الإعدادات', subtitle: 'نطاق الشركة والمخزن والتصنيفات الافتراضية', area: 'settings' } },

  { path: '/dev/design-system', name: 'design-system', component: () => import('@/features/design-system/DesignSystemShowcase.vue'), meta: { label: 'نظام التصميم', subtitle: 'مرجع تطويري (خارج تنقل المنتج)', area: 'development' } },

  { path: '/:pathMatch(.*)*', name: 'not-found', component: () => import('@/features/shared/NotFoundPage.vue'), meta: { label: 'صفحة غير موجودة', area: 'development' } },
]

export const router = createRouter({
  history: import.meta.env.MODE === 'test' ? createMemoryHistory() : createWebHistory(import.meta.env.BASE_URL),
  routes,
  scrollBehavior: () => ({ top: 0 }),
})
