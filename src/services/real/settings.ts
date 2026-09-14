import type { RpcTransport } from '@/services/api/frappe-rpc'
import type { OperationalSettings, OperationalSettingsInput, OperationalSettingsService, SettingOption, SettingsLookups } from '@/services/contracts'

const API = 'cardboard_management.cardboard_management.api.operational_settings'

interface RawSettings {
  company?: string
  default_warehouse?: string
  cardboard_item_group?: string
  default_supplier_group?: string
  default_mode_of_payment?: string
  capabilities: { can_read: boolean; can_edit: boolean }
}

interface RawLookup {
  data: Array<{ name: string; display_name?: string }>
}

const mapOptions = (raw: RawLookup): SettingOption[] => raw.data.map((row) => ({ name: row.name, displayName: row.display_name ?? row.name }))

export function createSettingsService(transport: RpcTransport): OperationalSettingsService {
  return {
    async get() {
      return transport.call<RawSettings>(`${API}.get_operational_settings`)
    },
    async save(input: OperationalSettingsInput) {
      return transport.call<RawSettings>(`${API}.update_operational_settings`, { ...input })
    },
    async lookups(company?: string): Promise<SettingsLookups> {
      // Each lookup is bounded and permission-checked; they are loaded
      // independently so one rejection cannot suppress the other selects.
      const [companies, warehouses, itemGroups, supplierGroups, modes] = await Promise.all([
        transport.call<RawLookup>(`${API}.lookup_companies`),
        transport.call<RawLookup>(`${API}.lookup_warehouses`, company ? { company } : {}),
        transport.call<RawLookup>(`${API}.lookup_cardboard_item_groups`),
        transport.call<RawLookup>(`${API}.lookup_supplier_groups`),
        transport.call<RawLookup>(`${API}.lookup_modes_of_payment`),
      ])
      return {
        companies: mapOptions(companies),
        warehouses: mapOptions(warehouses),
        itemGroups: mapOptions(itemGroups),
        supplierGroups: mapOptions(supplierGroups),
        modesOfPayment: mapOptions(modes),
      }
    },
  }
}

export type { OperationalSettings }
