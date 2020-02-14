import { RunContext } from './runContext'


export interface NodeImplementation {
  prerun?: NodeImplementationRunFunction,
  run: NodeImplementationPrerunFunction,
}

export interface NodeImplementationRunFunction {
  (context: RunContext, argument?: any): any
}
export interface NodeImplementationPrerunFunction {
  (context: RunContext, argument?: any): any
}

export type LibrariesWithNodeImplementations = {
  [implementationRef: string]: NodeImplementation | undefined
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
