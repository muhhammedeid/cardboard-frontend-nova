/** Shared pagination envelope returned by every app-owned list method. */
export interface Page<T> {
  data: T[]
  page: number
  pageSize: number
  total: number
  hasMore: boolean
}

export interface Lookup {
  name: string
  label: string
}

export interface ListQuery {
  page?: number
  pageSize?: number
  search?: string
}

export * from './inventory'
export * from './reporting'
export * from './reports'
export * from './supply'
export * from './sales'
export * from './supplier'
export * from './payment'
export * from './expense'
export * from './settings'
export * from './session'
