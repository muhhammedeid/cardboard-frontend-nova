import { describe, expect, it } from 'vitest'

import { createMockSalesService, createMockSupplierService } from './services'

/**
 * Fixture mode is the demo path, so it must expose the same shapes the real
 * services do - otherwise a demo breaks where production works.
 */
describe('mock runtime (fixture mode)', () => {
  it('answers the sales create capability so the form stays usable', async () => {
    const caps = await createMockSalesService().getCreateCapabilities()

    expect(caps.canCreate).toBe(true)
    expect(caps.canSubmit).toBe(true)
  })

  it('serves a windowed statement with totals, like the real endpoint', async () => {
    const service = createMockSupplierService()
    const first = await service.statement('SUP-0001', undefined, undefined, 1, 2)

    expect(first.page).toBe(1)
    expect(first.pageSize).toBe(2)
    expect(first.entries).toHaveLength(2)
    expect(first.total).toBeGreaterThan(2)
    expect(first.hasMore).toBe(true)
    expect(first.submittedOnly).toBe(true)

    const second = await service.statement('SUP-0001', undefined, undefined, 2, 2)

    expect(second.page).toBe(2)
    expect(second.entries[0]?.name).not.toBe(first.entries[0]?.name)
  })

  it('merges supplies and payments into one timeline with readable labels', async () => {
    const report = await createMockSupplierService().statement('SUP-0001')

    expect(report.entries.some((entry) => entry.type === 'supply')).toBe(true)
    expect(report.entries.some((entry) => entry.type === 'payment')).toBe(true)
    expect(report.entries.every((entry) => entry.name.length > 0 && entry.postingDate.length > 0)).toBe(true)
    expect(report.entries.every((entry) => typeof entry.amount === 'number')).toBe(true)
  })

  it('keeps the summary numbers and the submitted-only flag on the statement', async () => {
    const report = await createMockSupplierService().statement('SUP-0001')

    expect(report.suppliedValue).toBeGreaterThan(0)
    expect(report.currentOutstanding).toBe(27280)
    expect(report.total).toBe(report.entries.length)
    expect(report.hasMore).toBe(false)
  })
})
