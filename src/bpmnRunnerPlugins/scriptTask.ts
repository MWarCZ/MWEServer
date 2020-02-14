import { NodeImplementation } from '../bpmnRunner'

/**
 * ScriptTask je uloha, ktera provede skript.
 */
export const scriptTaskImplementation: NodeImplementation = {
  prerun(context, args) {
    return true
  },
  run(context, args: {script: string, scriptFormat: string}) {

    return true
  },
}
