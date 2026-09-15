/**
 * Presentation formatting only.
 *
 * Hard boundary: Nova never derives business values. Nothing here computes a
 * total, discount, weight, outstanding, valuation or status. These helpers only
 * render values the backend already returned, with bidi-safe isolation.
 */

const ARABIC_EGYPT_CURRENCY = 'ج.م'

const moneyFormat = new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const quantityFormat = new Intl.NumberFormat('en-US', { maximumFractionDigits: 3 })

export function formatMoney(value: string | number | null | undefined, currency = ARABIC_EGYPT_CURRENCY): string {
  const numeric = Number(value)
  if (value === null || value === undefined || value === '' || !Number.isFinite(numeric)) return '—'
  return `${moneyFormat.format(numeric)} ${currency}`
}

export function formatQuantity(value: string | number | null | undefined, unit = 'Kg'): string {
  const numeric = Number(value)
  if (value === null || value === undefined || value === '' || !Number.isFinite(numeric)) return '—'
  return `${quantityFormat.format(numeric)} ${unit}`.trim()
}

export function formatCount(value: string | number | null | undefined): string {
  const numeric = Number(value)
  if (!Number.isFinite(numeric)) return '—'
  return moneyFormat.format(numeric).replace(/\.00$/, '')
}

export function displayOr(value: string | number | null | undefined, placeholder = '—'): string {
  if (value === null || value === undefined) return placeholder
  const text = String(value).trim()
  return text === '' ? placeholder : text
}

export type StatusTone = 'draft' | 'submitted' | 'cancelled' | 'paid' | 'partly-paid' | 'unpaid' | 'current' | 'end-of-day' | 'neutral'

const STATUS_LABELS: Record<string, { label: string; tone: StatusTone }> = {
  draft: { label: 'مسودة', tone: 'draft' },
  submitted: { label: 'معتمد', tone: 'submitted' },
  cancelled: { label: 'ملغي', tone: 'cancelled' },
  paid: { label: 'تم الدفع', tone: 'paid' },
  'partly paid': { label: 'مدفوع جزئيًا', tone: 'partly-paid' },
  partly_paid: { label: 'مدفوع جزئيًا', tone: 'partly-paid' },
  partially_paid: { label: 'مدفوع جزئيًا', tone: 'partly-paid' },
  'partially paid': { label: 'مدفوع جزئيًا', tone: 'partly-paid' },
  unpaid: { label: 'غير مدفوع', tone: 'unpaid' },
  not_generated: { label: 'لم يُنشأ بعد', tone: 'neutral' },
  current: { label: 'حالي', tone: 'current' },
  'end of day': { label: 'نهاية اليوم', tone: 'end-of-day' },
  end_of_day: { label: 'نهاية اليوم', tone: 'end-of-day' },
}

/** Maps backend status wording to the approved Arabic operational vocabulary. */
export function statusPresentation(status: string | null | undefined): { label: string; tone: StatusTone } {
  if (!status) return { label: '—', tone: 'neutral' }
  const key = status.trim().toLowerCase()
  return STATUS_LABELS[key] ?? { label: status, tone: 'neutral' }
}

export function docstatusToStatus(docstatus: number | undefined): 'draft' | 'submitted' | 'cancelled' {
  if (docstatus === 1) return 'submitted'
  if (docstatus === 2) return 'cancelled'
  return 'draft'
}

export function todayIso(): string {
  const now = new Date()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const day = String(now.getDate()).padStart(2, '0')
  return `${now.getFullYear()}-${month}-${day}`
}

export function toNumber(value: unknown, fallback = 0): number {
  const numeric = Number(value)
  return Number.isFinite(numeric) ? numeric : fallback
}
