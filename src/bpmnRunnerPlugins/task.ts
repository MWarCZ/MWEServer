import { NodeImplementation } from '../bpmnRunner'

/**
 * Task je uloha, ktera se vzdy vykona uspesne.
 * Slouzi prevazne k ladeni.
 */
export const taskImplementation: NodeImplementation = {
  run() {
    return true
  },
}
