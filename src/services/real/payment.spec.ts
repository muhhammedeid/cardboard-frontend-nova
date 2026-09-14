import { describe, expect, it } from 'vitest'

import { PAYMENT_CONTEXT, PAYMENT_DETAIL, PAYMENT_LIST, PAYMENT_MODES, PAYMENT_SCHEMA, PAYMENT_SUPPLIERS } from './__fixtures__/observed'
import { createRecordingTransport } from './__fixtures__/rpc'
import { createPaymentService } from './payment'

const API = 'cardboard_management.cardboard_management.api.supplier_payments'

describe('supplier payment service against captured live payloads', () => {
  it('posts the paged list query to the app-owned path', async () => {
    const { rpc, calls } = createRecordingTransport(PAYMENT_LIST)
    const page = await createPaymentService(rpc).list({ page: 1, pageSize: 3 })

    expect(calls[0].method).toBe(`${API}.list_supplier_payments`)
    expect(calls[0].args).toMatchObject({ page: 1, page_size: 3 })
    expect(page.total).toBe(PAYMENT_LIST.total)
    expect(page.data).toHaveLength(PAYMENT_LIST.data.length)
  })

  it('reads every list field the backend actually sends', async () => {
    const { rpc } = createRecordingTransport(PAYMENT_LIST)
    const [row] = (await createPaymentService(rpc).list()).data
    const raw = PAYMENT_LIST.data[0]

    expect(row.name).toBe(raw.name)
    expect(row.postingDate).toBe(raw.posting_date)
    expect(row.supplier).toBe(raw.supplier)
    expect(row.supplierName).toBe(raw.supplier_name)
    expect(row.amount).toBe(raw.amount)
    expect(row.modeOfPayment).toBe(raw.mode_of_payment)
    expect(row.status).toBe(raw.status)
    expect(row.docstatus).toBe(raw.docstatus)
  })

  it('reads the accounting numbers the payment detail carries', async () => {
    const { rpc, calls } = createRecordingTransport(PAYMENT_DETAIL)
    const detail = await createPaymentService(rpc).get(PAYMENT_DETAIL.name)

    expect(calls[0].method).toBe(`${API}.get_supplier_payment`)
    expect(detail.paymentStatus).toBe(PAYMENT_DETAIL.payment_status)
    expect(detail.currentSupplierOutstanding).toBe(PAYMENT_DETAIL.current_supplier_outstanding)
    expect(detail.expectedRemainingOutstanding).toBe(PAYMENT_DETAIL.expected_remaining_outstanding)
    expect(detail.capabilities.canSubmit).toBe(PAYMENT_DETAIL.capabilities.can_submit)
  })

  it('reads the create capability from the new-payment schema', async () => {
    const { rpc, calls } = createRecordingTransport(PAYMENT_SCHEMA)
    const schema = await createPaymentService(rpc).schema()

    expect(calls[0].method).toBe(`${API}.get_new_supplier_payment_schema`)
    expect(schema.defaultPostingDate).toBe(PAYMENT_SCHEMA.default_posting_date)
    expect(schema.capabilities.canCreate).toBe(PAYMENT_SCHEMA.capabilities.can_create)
  })

  it('flattens the supplier and mode suggestions', async () => {
    const suppliers = createRecordingTransport(PAYMENT_SUPPLIERS)
    const options = await createPaymentService(suppliers.rpc).lookupSuppliers('NOVA')
    expect(suppliers.calls[0].method).toBe(`${API}.lookup_suppliers`)
    expect(options.map((option) => option.supplier)).toEqual(PAYMENT_SUPPLIERS.data.map((row) => row.supplier))

    const modes = createRecordingTransport(PAYMENT_MODES)
    const values = await createPaymentService(modes.rpc).lookupModes()
    expect(modes.calls[0].method).toBe(`${API}.lookup_modes_of_payment`)
    expect(values).toEqual(PAYMENT_MODES.data.map((row) => row.name))
  })

  it('reads the company and outstanding context for the chosen supplier', async () => {
    const { rpc, calls } = createRecordingTransport(PAYMENT_CONTEXT)
    const context = await createPaymentService(rpc).context('UAT W01 Supplier 20260913')

    expect(calls[0].method).toBe(`${API}.get_supplier_payment_context`)
    expect(calls[0].args).toMatchObject({ supplier: 'UAT W01 Supplier 20260913' })
    expect(context.company).toBe(PAYMENT_CONTEXT.company)
    expect(context.currentSupplierOutstanding).toBe(PAYMENT_CONTEXT.current_supplier_outstanding)
  })
})
