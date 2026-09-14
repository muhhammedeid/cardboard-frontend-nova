export interface OperationalSettings {
  company?: string
  default_warehouse?: string
  cardboard_item_group?: string
  default_supplier_group?: string
  default_mode_of_payment?: string
  capabilities: { can_read: boolean; can_edit: boolean }
}

export type OperationalSettingsInput = Pick<
  OperationalSettings,
  'company' | 'default_warehouse' | 'cardboard_item_group' | 'default_supplier_group' | 'default_mode_of_payment'
>

export interface SettingOption {
  name: string
  displayName: string
}

/** Bounded, permission-checked identifiers for the settings selects. */
export interface SettingsLookups {
  companies: SettingOption[]
  warehouses: SettingOption[]
  itemGroups: SettingOption[]
  supplierGroups: SettingOption[]
  modesOfPayment: SettingOption[]
}

export interface OperationalSettingsService {
  get(): Promise<OperationalSettings>
  save(input: OperationalSettingsInput): Promise<OperationalSettings>
  lookups(company?: string): Promise<SettingsLookups>
}
