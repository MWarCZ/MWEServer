

export class AuthorizationError extends Error {
  static defaultMessage = `We were unable to verify your identity.`
  static defaultMessageCZ = `Nepodařilo se nám ověřit vaši totožnost.`
  constructor(msg: string = AuthorizationError.defaultMessageCZ) {
    super(msg)
  }
}
