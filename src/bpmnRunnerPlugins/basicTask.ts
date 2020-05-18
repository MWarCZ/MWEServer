///////////////////////////////////////
// Soubor: src/bpmnRunnerPlugins/basicTask.ts
// Projekt: MWEServer
// Autor: Miroslav Válka
///////////////////////////////////////
import { NodeImplementation } from '../bpmnRunner'

/**
 * Task je uloha, ktera se vzdy vykona uspesne.
 * Slouzi prevazne k ladeni.
 */
export const BasicTask: NodeImplementation = {
  run() {
    return true
  },
  onCompleting({ fn, context }) {
    if (!fn.initNext) return
    fn.initNext(context.$OUTGOING)
  },
}
