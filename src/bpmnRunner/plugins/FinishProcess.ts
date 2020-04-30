import { ServiceImplementation } from '../pluginsImplementation'

//#region FinishRegister

export interface FinishProcessDone {
  (data:{finished: boolean, forced: boolean, type?: string}): void
}
export class FinishProcess implements ServiceImplementation {
  done?: FinishProcessDone
  name = 'finishProcess'
  data: {
    finished: boolean,
    forced: boolean,
    type?: string,
  } = {
    finished: false,
    forced: false,
  }
  fn(options?: { forced: boolean, type?: string }) {
    this.data.finished = true
    if (options) {
      this.data.forced = !!options.forced
      this.data.type = options.type
    }
    this.done && this.done(this.data)
  }
  constructor(options?: {
    name?: string,
    done?: FinishProcessDone,
  }) {
    let { name, done } = options || {}
    name && (this.name = name)
    done && (this.done = done)
  }
}

//#endregion
