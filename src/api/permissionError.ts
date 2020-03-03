

export class PermissionError extends Error {
  constructor(msg: string = 'You don\'t have enough permission.') {
    super(msg)
  }
}
