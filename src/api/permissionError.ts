

export class PermissionError extends Error {
  static defaultMessage = `You don't have enough permission.`
  constructor(msg: string = PermissionError.defaultMessage) {
    super(msg)
  }
}

export class UnloggedUserError extends PermissionError {
  static defaultMessage = `${PermissionError.defaultMessage} You're not logged.`
  constructor(msg: string = UnloggedUserError.defaultMessage) {
    super(msg)
  }
}
