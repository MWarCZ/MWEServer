import { NodeImplementation } from '../bpmnRunner'

/**
 *
 */
export const EndEvent: NodeImplementation = {
  run() { },
  onCompleting({ finishProcess, context }) {
    // console.warn(JSON.stringify(context, null, 2))
    finishProcess()
  },
}
