import { Json, JsonMap } from '../../types/json'
import { ServiceImplementation } from '../pluginsImplementation'

//#region DataRegister

export interface DataRegisterDone {
  (allData: JsonMap, name: string, newData?: Json): void
}
export class DataRegister implements ServiceImplementation {
  done?: DataRegisterDone
  name = 'dataRegister'
  data: JsonMap = {}
  fn(name: string, data?: Json) {
    if (typeof data === 'undefined') {
      delete this.data[name]
    } else {
      this.data[name] = data
    }
    this.done && this.done(this.data, name, data)
  }
  constructor(options?: {
    name?: string,
    done?: DataRegisterDone,
  }) {
    let { name, done } = options || {}
    name && (this.name = name)
    done && (this.done = done)
  }
}

//#endregion
