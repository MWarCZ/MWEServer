

export class AuthorizationError extends Error {
  constructor(msg: string = 'We were unable to verify your identity.') {
    super(msg)
  }
}
