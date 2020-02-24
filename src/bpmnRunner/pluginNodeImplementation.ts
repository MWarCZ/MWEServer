import { Json } from '../types/json'
import { RunContext } from './runContext'

export type FilterProps_NodeElementTemplate = {
  id: number,
  bpmnId: string,
  name: string,
  implementation: string,
  data: any,
}

/**
 * Rozhrani definujici podobu pluginu
 */
export interface NodeImplementation {
  options?: {
    // Obdrzi datove objekty A) vedou primo do uzlu X B) Vsechny datove objekty instance procesu.
    scope_inputs?: 'local' | 'global',
    // Obdrzi datove objekty A) vedou primo do uzlu X B) Vsechny datove objekty instance procesu.
    scope_outputs?: 'local' | 'global',
    // Ziskat i jine uzly, ktere by mohly mit vliv na chovani (Skok v provadeni na jiny uzel)
    // Prida do `args` polozku `provideNodes` s polem uzlu, ktere vyhovuji funkci.
    provideNodes?: (node:FilterProps_NodeElementTemplate)=>boolean,
  }

  // Akce doplnujici hodnoty (dodatky) pro predpokladany validni pruchod pres prerun.
  additions?: NodeImplementationFunction
  // Vraci jake hodnoty (dotatky) jsou vyzadovany pro spusteni.
  additionsFormat?: NodeImplementationFunction
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

export interface NodeImplementationFunctionOptions {
  context: RunContext,
  args?: any,
  // Funkce ktera vytvori dalsi instance elementu dle vybranych id sablon elementu
  initNext: (sequenceFlowIds: number[]|{id: number}[]) => void,
  finishProcess: (options?: { forced: boolean }) => void,
  registerData: (name: string, data: Json) => void,
}

export interface NodeImplementationFunction {
  (options: NodeImplementationFunctionOptions): any
}

export type LibrariesWithNodeImplementations = {
  [implementationRef: string]: NodeImplementation | undefined,
}

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
