///////////////////////////////////////
// Soubor: src/bpmnRunner/plugins/CallsCounter.ts
// Projekt: MWEServer
// Autor: Miroslav Válka
///////////////////////////////////////
import { ServiceImplementation } from '../pluginsImplementation'

//#region CallsCounter

export interface CallsCounterDone {
  (counter: number): void
}

/**
 * Jednoduchy modul pro pocitani poctu volani funkce.
 */
export class CallsCounter implements ServiceImplementation {
  done?: CallsCounterDone
  name = 'callsCounter'
  counter: number = 0
  fn() {
    this.counter++
    this.done && this.done(this.counter)
  }
  constructor(options?: {
    name?: string,
    done?: CallsCounterDone,
  }) {
    let { name, done } = options || {}
    name && (this.name = name)
    done && (this.done = done)
  }
}

//#endregion
