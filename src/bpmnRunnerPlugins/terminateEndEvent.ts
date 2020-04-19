import { NodeImplementation } from '../bpmnRunner'

/**
 *
 */
export const TerminateEndEvent: NodeImplementation = {
  run() { },
  onCompleting({ fn, context }) {
    if (!fn.finishProcess) return
    fn.finishProcess({forced: true})
  },
}
