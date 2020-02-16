import { RunContext } from './runContext'

/**
 * Rozhrani definujici podobu pluginu
 */
export interface NodeImplementation {
  prerun?: NodeImplementationFunction,
  run: NodeImplementationFunction,
  onCompleting?: NodeImplementationFunction,
  onFailing?: NodeImplementationFunction,
}

export interface NodeImplementationFunctionOptions {
  context: RunContext,
  args?: any,
  // Funkce ktera vytvori dalsi instance elementu dle vybranych id sablon elementu
  initNext: (sequenceFlowIds: number[]|{id: number}[]) => void
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
