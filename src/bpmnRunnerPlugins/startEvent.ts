import { NodeImplementation } from '../bpmnRunner'

/**
 *
 */
export const startEventImplementation: NodeImplementation = {
  run() { },
  onCompleting({ initNext, context }) {
    // console.log({ o: context.$OUTGOING})
    initNext(context.$OUTGOING)
  },
}
