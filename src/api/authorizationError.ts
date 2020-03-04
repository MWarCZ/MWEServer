

export class AuthorizationError extends Error {
  static defaultMessage = `We were unable to verify your identity.`
  constructor(msg: string = AuthorizationError.defaultMessage) {
    super(msg)
  }
}
