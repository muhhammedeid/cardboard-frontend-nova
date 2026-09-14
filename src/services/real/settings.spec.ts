import { describe, expect, it } from 'vitest'

import { SETTINGS, SETTINGS_COMPANIES, SETTINGS_ITEM_GROUPS, SETTINGS_WAREHOUSES } from './__fixtures__/observed'
import { createRecordingTransport } from './__fixtures__/rpc'
import { createSettingsService } from './settings'

const API = 'cardboard_management.cardboard_management.api.operational_settings'

describe('operational settings service against captured live payloads', () => {
  it('reads the persisted settings and its capability flags', async () => {
    const { rpc, calls } = createRecordingTransport(SETTINGS)
    const settings = await createSettingsService(rpc).get()

    expect(calls[0].method).toBe(`${API}.get_operational_settings`)
    expect(settings.company).toBe(SETTINGS.company)
    expect(settings.default_warehouse).toBe(SETTINGS.default_warehouse)
    expect(settings.cardboard_item_group).toBe(SETTINGS.cardboard_item_group)
    expect(settings.default_supplier_group).toBe(SETTINGS.default_supplier_group)
    expect(settings.default_mode_of_payment).toBe(SETTINGS.default_mode_of_payment)
    expect(settings.capabilities.can_read).toBe(SETTINGS.capabilities.can_read)
    expect(settings.capabilities.can_edit).toBe(SETTINGS.capabilities.can_edit)
  })

  it('loads the five bounded lookups and scopes warehouses to the company', async () => {
    const calls: string[] = []
    const rpc = {
      async call<T>(method: string, args: Record<string, unknown> = {}): Promise<T> {
        calls.push(`${method}|${JSON.stringify(args)}`)
        return { data: [] } as unknown as T
      },
    }

    await createSettingsService(rpc).lookups('Renod Industries')

    expect(calls.map((entry) => entry.split('|')[0])).toEqual([
      `${API}.lookup_companies`,
      `${API}.lookup_warehouses`,
      `${API}.lookup_cardboard_item_groups`,
      `${API}.lookup_supplier_groups`,
      `${API}.lookup_modes_of_payment`,
    ])
    expect(calls[1]).toContain('"company":"Renod Industries"')
  })

  it('keeps identifier/label pairs intact', async () => {
    const companies = createRecordingTransport(SETTINGS_COMPANIES)
    const itemGroups = createRecordingTransport(SETTINGS_ITEM_GROUPS)
    const serviceA = createSettingsService(companies.rpc)
    const serviceB = createSettingsService(itemGroups.rpc)

    const first = await serviceA.lookups()
    const second = await serviceB.lookups()

    expect(first.companies).toEqual(SETTINGS_COMPANIES.data.map((row) => ({ name: row.name, displayName: row.display_name })))
    expect(second.itemGroups).toEqual(SETTINGS_ITEM_GROUPS.data.map((row) => ({ name: row.name, displayName: row.display_name })))
  })

  it('returns one option per warehouse the server offered', async () => {
    const { rpc } = createRecordingTransport(SETTINGS_WAREHOUSES)
    const lookups = await createSettingsService(rpc).lookups()

    expect(lookups.warehouses).toHaveLength(SETTINGS_WAREHOUSES.data.length)
    expect(lookups.warehouses[0]).toEqual({
      name: SETTINGS_WAREHOUSES.data[0].name,
      displayName: SETTINGS_WAREHOUSES.data[0].display_name,
    })
  })
})
