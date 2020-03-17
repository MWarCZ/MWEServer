import { ServiceImplementation } from '../pluginsImplementation'

//#region FinishRegister

export interface FinishProcessDone {
  (data:{finished: boolean, forced: boolean}): void
}
export class FinishProcess implements ServiceImplementation {
  done?: FinishProcessDone
  name = 'finishProcess'
  data: {
    finished: boolean,
    forced: boolean,
  } = {
    finished: false,
    forced: false,
  }
  fn(options?: { forced: boolean }) {
    this.data.finished = true
    if (options) {
      this.data.forced = !!options.forced
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
