export interface SessionIdentity {
  user: string
}

export interface SessionService {
  context(): Promise<SessionIdentity>
}
