# Nova Design System — Graphite Indigo

نظام التصميم الخاص بالواجهة المستقلة الثانية لتطبيق إدارة الكرتون. هدفه: واجهة
تشغيلية كثيفة المعلومات، عربية RTL بالكامل، بمظهرين (نهاري/داكن) من **نفس**
ملف الأنماط عبر توكنات دلالية.

## 1. الفكرة البصرية

| العنصر | Nova (هذه الواجهة) | الواجهة الحالية |
|---|---|---|
| Canvas | رمادي‑مزرق بارد (`#f2f4fa` / `#070a13`) | ورقي دافئ (`#f7f5ef` / `#18211f`) |
| Primary | نيلي كهربائي (`#4f46e5` / `#7c7bff`) + تدرّج إلى سماوي | أخضر مزرق صناعي (`#0f766e`) |
| الأوزان | سماوي (`--accent`) | نفس الأخضر المزرق |
| الخط | `Readex Pro` هندسي حديث | `IBM Plex Sans Arabic` |
| الشكل | حواف 10–18px، توهّج نيلي خفيف، بنتو للمؤشرات | حواف 8–16px، مسطّح صناعي |
| الأيقونات | مجموعة SVG واحدة (28 أيقونة) بسمك 1.75 | رموز نصية/إيموجي |

## 2. التوكنات

- **أسطح:** `--canvas`, `--surface`, `--surface-2/3`, `--surface-hover`, `--glass`, `--surface-overlay`
- **نص:** `--text`, `--text-strong`, `--text-muted`, `--text-faint`
- **خطوط:** `--border`, `--border-strong`, `--border-subtle`, `--ring`
- **هوية:** `--primary(-hover/-active/-soft)`, `--brand-gradient`, `--accent`
- **دلالات:** `--success`, `--warning`, `--danger`, `--info` + نسخ `-soft`
- **أدوار القيم:** `--money` (نيلي), `--weight` (سماوي), `--code` (رمادي)
- **ظلال:** `--shadow-1/2/3`, `--shadow-glow`, `--highlight`
- **قياسات:** `--space-*`, `--radius-*`, `--control-h*`, `--rail-w`, `--topbar-h`, `--content-max`
- **حركة:** `--motion-fast|base`, `--ease` + احترام `prefers-reduced-motion`

قاعدة صارمة: أي مكوّن يستخدم alias دلاليًا فقط، ولا لونًا حرفيًا، حتى يعمل تحت
المظهرين بلا تكرار CSS.

## 3. الهيكل والتخطيط

- شريط جانبي RTL بعرض `16.5rem` (مضغوط `4.25rem` على التابلت) وشبكة مناطق مسماة
  `'rail main'`، مع تمرير داخلي و`100dvh`.
- شريط علوي ثابت بخلفية زجاجية يحتوي: عنوان الصفحة (من الـrouter أو سجل التقارير)،
  سياق الشركة/المخزن، إجراء جديد، مبدّل المظهر، قائمة الحساب.
- الجوال: شريط تنقل سفلي بأربع اختصارات + دروار جانبي، والجداول تتحول إلى بطاقات
  سجلات (`RecordCards`).

## 4. المكونات

| المجموعة | المكونات |
|---|---|
| أساسية | `AppIcon`, `AppButton`, `AppInput`, `AppSelect`, `AppTextarea`, `FormField`, `BidiValue`, `MoneyValue`, `QuantityValue`, `CodeValue` |
| بيانات | `AppPanel`, `PageHeader`, `MetricCard`, `StatusBadge`, `AppBadge`, `DataTable`, `RecordCards`, `FactsList`, `DataTimeline`, `DistributionBars`, `AppTabs`, `AppPagination`, `FilterBar`, `ContextChip` |
| حالات | `LoadingState`, `SkeletonBlock`, `EmptyState`, `ErrorState`, `PermissionState`, `NotFoundState`, `AppDialog`, `AppDrawer`, `ToastHost` |
| تنقل | `AppSidebar`, `TopBar`, `ThemeToggle`, `QuickCreateMenu`, `AccountMenu` |

## 5. قواعد الاتجاه (RTL)

- لا قيم فيزيائية (`left/right`) في التخطيط؛ كل شيء منطقي (`inline-*`).
- كل قيمة مختلطة (كود، رقم، عملة، وحدة) تُعرض داخل `<bdi dir="ltr">` عبر مكونات
  القيم المشتركة، لا بالتجميع النصي اليدوي.
- الجداول: الأعمدة الرقمية `data-align="end"` مع `tabular-nums`، والأكواد بخط أحادي.

## 6. المظهر

- التفضيل يُحفظ في `localStorage['nova-theme']` بالقيم `light | dark | system`.
- يُحلّ قبل تركيب Vue عبر سكربت في `index.html` لمنع وميض المظهر، ثم يتولى
  `createThemeController` التبديل الحيّ عند تغيير تفضيل النظام.
- مفتاح مختلف عن الواجهة الحالية (`cardboard-theme`) عن قصد: لا تتشارك الواجهتان
  حالة المظهر.

## 7. عرض القيم والحدود

- `DistributionBars` يرسم عرض شريط نسبيًا لأكبر قيمة **معادة من الخادم** للترتيب
  البصري فقط، ويعرض الأرقام كما هي؛ لا يُحسب إجمالي أو نسبة أعمال.
- لا تنسيق تواريخ جديد: التواريخ تُعرض ISO كما يعيدها الخادم.
- الأخطاء تُطبّع في `services/api/errors.ts`: الرسائل المتسلسلة من Frappe
  (`_server_messages`, `exc_type`, traceback) تُرفض ولا تصل للمشغّل.
