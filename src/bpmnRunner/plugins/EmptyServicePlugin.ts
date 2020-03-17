import { ServiceImplementation } from '../pluginsImplementation'

//#region EmptyServicePlugin

export interface EmptyServicePluginDone {
  (...args: any[]): void
}
export class EmptyServicePlugin implements ServiceImplementation {
  done?: EmptyServicePluginDone
  name = 'empty'
  fn(...args: any[]) {
    this.done && this.done(...args)
  }
  constructor(options?: {
    name?: string,
    done?: EmptyServicePluginDone,
  }) {
    let { name, done } = options || {}
    name && (this.name = name)
    done && (this.done = done)
  }
}

//#endregion
