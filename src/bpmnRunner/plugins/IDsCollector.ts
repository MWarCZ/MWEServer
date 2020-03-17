import { ServiceImplementation } from '../pluginsImplementation'

//#region IDsCollector

/**
 * Ukazka implementace sluzky se zpetnym volanim.
 * fn: pole obsahujici polozky id nebo objekt s id
 * done: pole obsahujici polozky id
 */
export interface IDsCollectorDone {
  (...ids: number[]): void
}
type IDsCollectorFnItem = number | { id: number }
export type IDsCollectorFnOptions = IDsCollectorFnItem | (IDsCollectorFnItem[])
export class IDsCollector implements ServiceImplementation {
  done?: IDsCollectorDone
  name = 'idsCollector'
  data: number[] = []
  fn(...targetIds: IDsCollectorFnOptions[]) {
    let ids = targetIds.map(t => {
      if (typeof t === 'number') {
        return t
      } else if (Array.isArray(t)) {
        return t.map(t2 => typeof t2 === 'number' ? t2 : t2.id)
      } else {
        return t.id
      }
    }).reduce((acc: number[], value) => {
      if(Array.isArray(value)) {
        acc.push(...value)
      } else {
        acc.push(value)
      }
      return acc
    }, [])
    this.data.push(...ids)
    this.done && this.done(...ids)
  }
  constructor(options?: {
    name?: string,
    done?: IDsCollectorDone,
  }) {
    let { name, done } = options || {}
    name && (this.name = name)
    done && (this.done = done)
  }
}

//#endregion
