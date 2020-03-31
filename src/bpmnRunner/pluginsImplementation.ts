import { RunContext, RunContextProvideNodes } from './runContext'

//#region NodeImplementation
/**
 * Rozhrani definujici podobu pluginu
 */
export interface NodeImplementation {
  options?: {
    // Obdrzi datove objekty A) vedou primo do uzlu X B) Vsechny datove objekty instance procesu.
    scope_inputs?: 'local' | 'global',
    // Obdrzi datove objekty A) vedou primo do uzlu X B) Vsechny datove objekty instance procesu.
    scope_outputs?: 'local' | 'global',
    // Pocet kolikrat dana instance jednoho uzlu muze existovat. (Resi problem nekonecne smycky a moznost jedinacka.)
    max_count_recurrence_node?: number,
    // Ziskat i jine uzly, ktere by mohly mit vliv na chovani (Skok v provadeni na jiny uzel)
    // Prida do `args` polozku `provideNodes` s polem uzlu, ktere vyhovuji funkci.
    provideNodes?: (node: RunContextProvideNodes) => boolean,
  }

  // Akce doplnujici hodnoty (dodatky) pro predpokladany validni pruchod pres prerun.
  // additions?: NodeImplementationFunction
  // Vraci jake hodnoty (dotatky) jsou vyzadovany pro spusteni.
  additionsFormat?: NodeImplementationFlatFunction
  // Akce pred spustenim hlavniho behoveho bloku uzlu
  // pr. validace vstupu, vyhodnoceni podminek, ...
  prerun?: NodeImplementationFunction,
  // Akce hlavniho behoveho bloku uzlu
  run: NodeImplementationFunction,
  // Akce po uspesnem dokonceni behoveho bloku uzlu
  onCompleting?: NodeImplementationFunction,
  // Akce po neuspesnem dokonceni behoveho bloku uzlu
  onFailing?: NodeImplementationFunction,
}

export interface NodeImplementationFnRegister {
  // // Funkce ktera vytvori dalsi instance elementu dle vybranych id sablon elementu
  // initNext: (sequenceFlowIds: number[] | { id: number }[]) => void,
  // // Funkce oznamujici ukonceni procesu.
  // finishProcess: (options?: { forced: boolean }) => void,
  // registerGlobal: (name: string, data?: Json) => void,
  // registerLocal: (name: string, data?: Json) => void,
  [key: string]: ((...args: any[]) => void) | undefined,
}

//#region Funkce pro beh uzlu
export interface NodeImplementationFunctionOptions {
  context: RunContext,
  fn: NodeImplementationFnRegister,
}

export interface NodeImplementationFunction {
  (options: NodeImplementationFunctionOptions): any
}
//#endregion

//#region Funkce pro zjisteni informaci od uzlu
export interface NodeImplementationFlatFunctionOptions {
  context: RunContext,
}

export interface NodeImplementationFlatFunction {
  (options: NodeImplementationFlatFunctionOptions): any
}
//#endregion

export type LibrariesWithNodeImplementations = {
  [implementationRef: string]: NodeImplementation | undefined,
}

//#endregion

//#region ServiceImplementation
export interface ServiceImplementation {
  name: string,
  fn: (...args: any[]) => void,
}

export interface xServiceImplementation {
  name: string,
  fn: ServiceImplementationFn,
}

export interface ServiceImplementationFn {
  (done?: ServiceImplementationCallback): void,
}
export interface ServiceImplementationCallback {
  (...args: any[]): void,
}

export type LibrariesWithServiceImplementations = ServiceImplementation[]

//#endregion

//#region Abrakadabra ServiceImplementation

let serviceObjImp: ServiceImplementation = {
  name: 'doNothing1',
  fn(...args) {
    // do xyz
  },
}
class ServiceClassImp implements ServiceImplementation {
  done?: (...args: any[]) => void
  name = 'doNothing2'
  fn(...args: any[]) {
    // do some
    this.done && this.done(...args)
  }
}
let serviceClassImp = new ServiceClassImp()

let l: LibrariesWithServiceImplementations = [serviceObjImp, serviceClassImp]

// let x = {
//   [serviceClassImp.name]: serviceClassImp.generateFn((...a) => console.log('C', a)),
//   [serviceObjImp.name]: serviceObjImp.generateFn((...a) => console.log('O', a)),
// }
// console.log(x)
// for(let key in x) {
//   let fn = x[key]
//   fn('volam',{key})
// }

//#endregion

//#region Abrakadabra NodeImplementation

let taskImplementation: NodeImplementation = {
  prerun(context) {
    return true
  },
  run(context) {
    return true
  },
}
let pluginsTaskImplementations: LibrariesWithNodeImplementations = {
  'task': taskImplementation,
}

//#endregion
