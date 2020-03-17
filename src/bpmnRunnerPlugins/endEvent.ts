import { NodeImplementation } from '../bpmnRunner'

/**
 *
 */
export const EndEvent: NodeImplementation = {
  run() { },
  onCompleting({ fn, context }) {
    // console.warn(JSON.stringify(context, null, 2))
    if (!fn.finishProcess) return
    fn.finishProcess()
  },
}
