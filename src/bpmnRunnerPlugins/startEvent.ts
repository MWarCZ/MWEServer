import { NodeImplementation } from '../bpmnRunner'

/**
 *
 */
export const StartEvent: NodeImplementation = {
  run() { },
  onCompleting({ fn, context }) {
    // console.log({ o: context.$OUTGOING})
    fn.initNext(context.$OUTGOING)
  },
}
