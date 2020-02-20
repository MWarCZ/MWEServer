import { NodeImplementation } from '../bpmnRunner'

/**
 *
 */
export const endEventImplementation: NodeImplementation = {
  run() { },
  onCompleting({ finishProcess, context }) {
    console.warn(JSON.stringify(context, null, 2))
    finishProcess()
  },
}
