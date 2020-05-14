///////////////////////////////////////
// Soubor: src/bpmnRunner/plugins/EmptyServicePlugin.ts
// Projekt: MWEServer
// Autor: Miroslav Válka
///////////////////////////////////////
import { ServiceImplementation } from '../pluginsImplementation'

//#region EmptyServicePlugin

export interface EmptyServicePluginDone {
  (...args: any[]): void
}
/** Jednoduchy modul, ktery nedela nic. */
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
