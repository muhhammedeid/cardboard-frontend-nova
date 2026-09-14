import { describe, expect, it } from 'vitest'

import { EXPENSE_CATEGORIES, EXPENSE_DETAIL, EXPENSE_LIST, EXPENSE_SCHEMA, EXPENSE_SOURCES } from './__fixtures__/observed'
import { createRecordingTransport } from './__fixtures__/rpc'
import { createExpenseService } from './expense'

const API = 'cardboard_management.cardboard_management.api.expenses'

describe('expense service against captured live payloads', () => {
  it('posts the paged list query to the app-owned path', async () => {
    const { rpc, calls } = createRecordingTransport(EXPENSE_LIST)
    const page = await createExpenseService(rpc).list({ status: 'Draft', pageSize: 5 })

    expect(calls[0].method).toBe(`${API}.list_expenses`)
    expect(calls[0].args).toMatchObject({ status: 'Draft', page_size: 5 })
    expect(page.total).toBe(EXPENSE_LIST.total)
    expect(page.data).toHaveLength(EXPENSE_LIST.data.length)
  })

  it('reads every list field the backend actually sends', async () => {
    const { rpc } = createRecordingTransport(EXPENSE_LIST)
    const [row] = (await createExpenseService(rpc).list()).data
    const raw = EXPENSE_LIST.data[0]

    expect(row.name).toBe(raw.name)
    expect(row.postingDate).toBe(raw.posting_date)
    expect(row.expenseCategory).toBe(raw.expense_category)
    expect(row.expenseCategoryName).toBe(raw.expense_category_name)
    expect(row.amount).toBe(raw.amount)
    expect(row.paymentSource).toBe(raw.payment_source)
    expect(row.paymentSourceName).toBe(raw.payment_source_name)
    expect(row.status).toBe(raw.status)
    expect(row.docstatus).toBe(raw.docstatus)
  })

  it('reads the accounting detail fields of one expense', async () => {
    const { rpc, calls } = createRecordingTransport(EXPENSE_DETAIL)
    const detail = await createExpenseService(rpc).get(EXPENSE_DETAIL.name)

    expect(calls[0].method).toBe(`${API}.get_expense`)
    expect(detail.accountingStatus).toBe(EXPENSE_DETAIL.accounting_status)
    expect(detail.paymentMode).toBe(EXPENSE_DETAIL.payment_mode)
    expect(detail.capabilities.canSubmit).toBe(EXPENSE_DETAIL.capabilities.can_submit)
  })

  it('reads the create capability the new-expense schema publishes', async () => {
    const { rpc, calls } = createRecordingTransport(EXPENSE_SCHEMA)
    const schema = await createExpenseService(rpc).schema()

    expect(calls[0].method).toBe(`${API}.get_new_expense_schema`)
    expect(schema.defaultPostingDate).toBe(EXPENSE_SCHEMA.default_posting_date)
    expect(schema.requiredFields).toEqual(EXPENSE_SCHEMA.required_fields)
    expect(schema.capabilities.canCreate).toBe(EXPENSE_SCHEMA.capabilities.can_create)
  })

  it('keeps the identifier/label pairs of both lookups', async () => {
    const categories = createRecordingTransport(EXPENSE_CATEGORIES)
    const options = await createExpenseService(categories.rpc).categories()
    expect(categories.calls[0].method).toBe(`${API}.lookup_expense_categories`)
    expect(options).toEqual(EXPENSE_CATEGORIES.data.map((row) => ({ name: row.name, displayName: row.display_name })))

    const sources = createRecordingTransport(EXPENSE_SOURCES)
    const paymentSources = await createExpenseService(sources.rpc).sources()
    expect(sources.calls[0].method).toBe(`${API}.lookup_expense_payment_sources`)
    expect(paymentSources).toHaveLength(EXPENSE_SOURCES.data.length)
  })
})
