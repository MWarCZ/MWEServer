import { NodeImplementation } from '../bpmnRunner'

/**
 * Task je uloha, ktera se vzdy vykona uspesne.
 * Slouzi prevazne k ladeni.
 */
export const BasicTask: NodeImplementation = {
  run() {
    return true
  },
  onCompleting({ initNext, context }) {
    initNext(context.$OUTGOING)
  },
}
