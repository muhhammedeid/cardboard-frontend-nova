import type { RpcTransport } from '@/services/api/frappe-rpc'

export interface RecordedCall {
  method: string
  args: Record<string, unknown>
}

/**
 * Transport double for the real-service specs: records the exact method path and
 * arguments a converter sends, and replays one captured live payload.
 */
export function createRecordingTransport(payload: unknown): { rpc: RpcTransport; calls: RecordedCall[] } {
  const calls: RecordedCall[] = []
  const rpc: RpcTransport = {
    async call<U>(method: string, args: Record<string, unknown> = {}): Promise<U> {
      calls.push({ method, args })
      return payload as U
    },
  }
  return { rpc, calls }
}
