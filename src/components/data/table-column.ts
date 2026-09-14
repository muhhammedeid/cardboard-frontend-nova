export interface TableColumn {
  key: string
  label: string
  align?: 'start' | 'end' | 'center'
  width?: string
}

export type ValueKind = 'text' | 'money' | 'quantity' | 'code' | 'status' | 'count'

export interface RecordCardFact {
  key: string
  label: string
  kind?: ValueKind
  unit?: string
}
