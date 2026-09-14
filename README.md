# Cardboard Management — Nova Frontend (independent second frontend)

واجهة أمامية **مستقلة** لتطبيق إدارة الكرتون (Frappe v15 + ERPNext), مبنية بمعمارية
ونظام تصميم مختلفين تمامًا («Nova — Graphite Indigo»), مع الحفاظ على **نفس عقد
الـbackend ونفس مسارات الشاشات** حتى تكون بديلًا جاهزًا للواجهة الحالية دون أي
تعديل على الخادم.

- Stack: Vue 3.5 + Vite 8 + TypeScript (strict) + Pinia + Vue Router
- RTL‑first، عربي، Light + Dark + System
- لا يوجد أي منطق أعمال في الواجهة: كل الأوزان والقيم والأرصدة تأتي من الخادم

---

## 1. التشغيل

```bash
npm install          # أو انسخ node_modules من الواجهة الحالية (نفس الإصدارات)
npm run dev          # real mode → http://localhost:5173 مع بروكسي /api إلى الخادم
npm run dev:mock     # mock mode  → http://localhost:5180 بدون أي خادم
npm run build        # typecheck + build إنتاجي (real)
npm run build:mock   # build تجريبي بمزود بيانات ثابتة (dist-mock)
```

### متغيرات البيئة

| الملف | القيمة | الاستخدام |
|---|---|---|
| `.env.example` | `VITE_API_MODE=real`, `VITE_API_BASE_URL=` | الإنتاج / UAT |
| `.env.mock` | `VITE_API_MODE=mock` | عرض تجريبي بدون خادم |

- `VITE_API_BASE_URL` يبقى فارغًا في التطوير (بروكسي نفس‑المضيف عبر Vite) وفي
  الاستضافة على نفس الأصل كما ينص عقد التشغيل السابق.
- النقل يستخدم كوكي جلسة Frappe (`credentials: 'include'`)، ويحصل على
  `X-Frappe-CSRF-Token` من
  `cardboard_management.cardboard_management.api.session.get_session_context`
  قبل أي طلب كتابة. لا يُضاف JWT ولا يُعطّل CSRF.
- mock mode لا يُفعّل أبدًا عند فشل الخادم: الاختيار يعتمد على البيئة فقط.

---

## 2. البنية

```text
src/
  app/
    bootstrap/config.ts        # VITE_API_MODE / VITE_API_BASE_URL
    theme/theme.ts             # مظهر light|dark|system + تخزين المفتاح nova-theme
    router/index.ts            # جدول المسارات (مطابق للواجهة الحالية)
    navigation/menu.ts         # تنقل واحد يشغّل الشريط والدروار وشريط الجوال
    stores/                    # session (هوية المستخدم) · context (الشركة/المخزن) · toasts · navigation
  services/
    api/                       # النقل (Frappe RPC) + تطبيع الأخطاء
    contracts/                 # DTOs typed لكل نطاق + تقارير
    real/                      # محوّلات حقيقية: كل مسار RPC موثّق بالاسم الكامل
    mocks/                     # مزود ثابت لكل مسار (list/detail/lookups/lifecycle/reports)
    formatting.ts              # تنسيق عرض فقط (بيدي‑آمن)
    index.ts                   # useServices(): نقطة التركيب الوحيدة
  components/                  # base · data · feedback · navigation
  layouts/AppShell.vue         # شريط جانبي RTL بشبكة مسماة + شريط علوي + دروار الجوال
  features/                    # شاشة لكل نطاق: home · supplies · sales · suppliers ·
                               # payments · expenses · inventory · reports · settings
  styles/                      # tokens · base · layout · components · print
```

**قاعدة الفصل:** الشاشة → خدمة النطاق → العقد المُنمّط → المحوّل (real/mock).
لا يستدعي أي مكوّن Frappe مباشرة، ولا يعيد بناء أي قيمة أعمال.

---

## 3. تغطية الشاشات

| المسار | الشاشة | المسار | الشاشة |
|---|---|---|---|
| `/` | لوحة التشغيل | `/payments` · `/payments/new` · `/payments/:id` | المدفوعات |
| `/supplies` · `/supplies/new` · `/supplies/:id` · `/supplies/:id/edit` | التوريدات | `/expenses` · `/expenses/new` · `/expenses/:id` · `/expenses/:id/edit` | المصروفات |
| `/sales` · `/sales/new` · `/sales/:id` · `/sales/:id/edit` | المبيعات | `/inventory` · `/inventory/history` · `/inventory/movement` | المخزون |
| `/suppliers` · `/suppliers/new` · `/suppliers/:id` | الموردون | `/reports` · `/reports/:reportKey` | 8 تقارير |
| `/settings` | الإعدادات التشغيلية | `/dev/design-system` | مرجع تطويري (خارج تنقل المنتج) |

مسارات `…/:id/edit` مضافة لتشغيل إجراء «تحرير المسودة» وفق capability من الخادم؛
المسارات الأخرى مطابقة للواجهة الحالية حرفيًا.

---

## 4. عقد الـbackend المستخدم (بدون أي تعديل على الخادم)

| الوظيفة | المسار الكامل |
|---|---|
| جلسة + CSRF | `cardboard_management.cardboard_management.api.session.get_session_context` |
| التوريدات | `…cardboard_management.api.supply.*` (list/get/lookup_*/create/update/submit/cancel/capture_*_weight/preview_supply/get_print_action/get_create_capabilities) |
| المبيعات | `…cardboard_management.api.sales.*` |
| الموردون | `…cardboard_management.api.suppliers.*` + `cardboard_management.reporting.get_supplier_summary|statement` |
| المدفوعات | `…cardboard_management.api.supplier_payments.*` |
| المصروفات | `…cardboard_management.api.expenses.*` |
| الإعدادات | `…cardboard_management.api.operational_settings.*` |
| المخزون | `cardboard_management.inventory.get_inventory_overview` |
| التقارير | `cardboard_management.reporting.get_operations_summary|get_inventory_movement|get_expense_summary|get_supplier_summary|get_supplier_statement` |

> **تصحيح مكتشف:** الواجهة الحالية تستدعي تقرير التوريدات عبر مسار قديم
> `cardboard_management.api.supply.list_supplies` بينما المسار الصحيح هو
> `cardboard_management.cardboard_management.api.supply.list_supplies`
> (الحزمة الداخلية للتطبيق). مجلد `cardboard_management/api/` موجود لكنه فارغ،
> لذلك الاستدعاء القديم يفشل في وضع real. تم استخدام المسار الصحيح هنا، ولم يُعدّل
> المشروع الأصلي.

---

## 5. نظام التصميم

- ألوان: Graphite/Indigo في النهار، Navy/Indigo متوهّج في الداكن — راجع `docs/DESIGN-SYSTEM.md`.
- خطوط: `Readex Pro` (عربي + لاتيني) مع بدائل نظام، وأرقام `tabular-nums`.
- RTL منطقي بالكامل (`inline-start/end`) وبدون أي transformer أو zoom hack.
- كل القيم المالية/الأوزان تمر عبر `MoneyValue` / `QuantityValue` / `BidiValue`
  لعزل الاتجاه (`<bdi dir="ltr">`).
- التنقل: `100dvh` للشريط مع تمرير مستقل، وشبكة مناطق مسماة، وانهيار إلى أيقونات
  على التابلت ودروار على الجوال.

---

## 6. الاستبدال (Cutover) — خطوات مقترحة عند الاعتماد

```bash
cd ~/frappe/cardboard-bench/apps/cardboard_management
mv frontend frontend-legacy                    # احتفظ بالواجهة الحالية مؤقتًا
cp -r <path-to-nova> frontend                  # بدون node_modules/dist
cd frontend && npm install && npm run build    # أو انسخ node_modules إن كانت الإصدارات نفسها
```

1. شغّل `npm run build` وثبّت الحزم.
2. شغّل `npm run dev` بجانب bench في وضع real وتحقق من تسجيل الدخول عبر الجلسة.
3. بعد قبول الـUAT، أعد تسمية `frontend-legacy` أو احذفه، وثبّت المسار في أي
   `hooks.py`/إعداد استضافة يشير إلى `frontend/dist`.

> هذا المجلد **غير مرتبط بمستودع التطبيق** ولا يعدّل أي ملف فيه؛ لا تنسخه إلى
> داخل `frontend/` قبل قرار الاعتماد.

---

## 7. الفحوصات

```bash
npm run typecheck   # vue-tsc strict
npm run lint        # eslint --max-warnings=0
npm run build       # typecheck + build
npm run test        # vitest (لا توجد ملفات اختبار في هذه الحزمة)
```

التحقق البصري مملوك للمستخدم: افتح المسارات أعلاه بزوم 100% وراجع المظهر النهاري
والداكن والشريط الجانبي والدروار والجداول/البطاقات على الجوال.
