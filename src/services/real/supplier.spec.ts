import { describe, expect, it } from 'vitest'

import { SUPPLIER_CAPS, SUPPLIER_DETAIL, SUPPLIER_LIST, SUPPLIER_SCHEMA } from './__fixtures__/observed'
import { createRecordingTransport } from './__fixtures__/rpc'
import { createSupplierService } from './supplier'

const API = 'cardboard_management.cardboard_management.api.suppliers'

describe('supplier service against captured live payloads', () => {
  it('posts the paged list query to the app-owned path', async () => {
    const { rpc, calls } = createRecordingTransport(SUPPLIER_LIST)
    const page = await createSupplierService(rpc).list({ search: 'UAT', status: 'enabled' })

    expect(calls[0].method).toBe(`${API}.list_suppliers`)
    expect(calls[0].args).toMatchObject({ search: 'UAT', status: 'enabled' })
    expect(page.total).toBe(SUPPLIER_LIST.total)
    expect(page.data).toHaveLength(SUPPLIER_LIST.data.length)
  })

  it('reads every list field the backend actually sends', async () => {
    const { rpc } = createRecordingTransport(SUPPLIER_LIST)
    const [row] = (await createSupplierService(rpc).list()).data
    const raw = SUPPLIER_LIST.data[0]

    expect(row.name).toBe(raw.name)
    expect(row.supplierName).toBe(raw.supplier_name)
    expect(row.supplierGroup).toBe(raw.supplier_group)
    expect(row.disabled).toBe(Boolean(raw.disabled))
  })

  it('maps the detail contacts and the read-only capability set', async () => {
    const { rpc, calls } = createRecordingTransport(SUPPLIER_DETAIL)
    const detail = await createSupplierService(rpc).get(SUPPLIER_DETAIL.name)

    expect(calls[0].method).toBe(`${API}.get_supplier`)
    expect(detail.supplierName).toBe(SUPPLIER_DETAIL.supplier_name)
    expect(detail.supplierType).toBe(SUPPLIER_DETAIL.supplier_type)
    expect(detail.mobileNo).toBe(SUPPLIER_DETAIL.mobile_no)
    expect(detail.emailId).toBe(SUPPLIER_DETAIL.email_id)
    expect(detail.primaryAddress).toBe(SUPPLIER_DETAIL.primary_address)
    expect(detail.capabilities.canCreate).toBe(SUPPLIER_DETAIL.capabilities.can_create)
    // The contract exposes supplier update as a deliberately unavailable right.
    expect(detail.capabilities.canEdit).toBe(false)
  })

  it('keeps the create schema the server published', async () => {
    const { rpc, calls } = createRecordingTransport(SUPPLIER_SCHEMA)
    const schema = await createSupplierService(rpc).schema()

    expect(calls[0].method).toBe(`${API}.get_new_supplier_schema`)
    expect(schema.requiredFields).toEqual(SUPPLIER_SCHEMA.required_fields)
    expect(schema.optionalFields).toEqual(SUPPLIER_SCHEMA.optional_fields)
    // The server also sends `system_managed_fields`; the contract's read-only set
    // is the field-level `read_only_fields` list.
    expect(schema.readOnlyFields).toEqual(SUPPLIER_SCHEMA.read_only_fields)
    expect(schema.defaultSupplierGroup).toBe(SUPPLIER_SCHEMA.default_supplier_group)
    expect(schema.supplierTypeDefault).toBe(SUPPLIER_SCHEMA.supplier_type_default)
  })

  it('reads the capability envelope for one supplier', async () => {
    const { rpc, calls } = createRecordingTransport(SUPPLIER_CAPS)
    const caps = await createSupplierService(rpc).capabilities(SUPPLIER_CAPS.name)

    expect(calls[0].method).toBe(`${API}.get_capabilities`)
    expect(caps.capabilities.canCreate).toBe(SUPPLIER_CAPS.capabilities.can_create)
    expect(caps.capabilities.canRead).toBe(SUPPLIER_CAPS.capabilities.can_read)
  })
})
