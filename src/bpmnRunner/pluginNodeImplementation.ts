import { RunContext } from './runContext'

/**
 * Rozhrani definujici podobu pluginu
 */
export interface NodeImplementation {
  options?: {
    scope_inputs: 'local' | 'global',
    scope_outputs: 'local' | 'global',
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
