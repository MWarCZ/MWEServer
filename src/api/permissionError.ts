

export class PermissionError extends Error {
  static defaultMessage = `You don't have enough permission.`
  static defaultMessageCZ = `Nemáte dostatečná opravnění.`
  constructor(msg: string = PermissionError.defaultMessageCZ) {
    super(msg)
  }
}

export class UnloggedUserError extends PermissionError {
  static defaultMessage = `${PermissionError.defaultMessage} You're not logged.`
  static defaultMessageCZ = `${PermissionError.defaultMessageCZ} Nejste přihlášen.`
  constructor(msg: string = UnloggedUserError.defaultMessageCZ) {
    super(msg)
  }
}
