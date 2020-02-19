import { NodeImplementation } from '../bpmnRunner'

/**
 *
 */
export const startEventImplementation: NodeImplementation = {
  run() { },
  onCompleting({ initNext, context }) {
    initNext(context.$OUTGOING)
  },
}
