import { ActivityStatus, FlowElementInstance } from '../entity/bpmn'
import { NodeImplementation } from './pluginNodeImplementation'
import { RunContext } from './runContext'


export function executeNodePrerun(options: {
  nodeInstance: FlowElementInstance,
  nodeImplementation: NodeImplementation,
  context: RunContext,
  args: any,
}): boolean {
  const {
    nodeInstance,
    nodeImplementation,
    context,
    args,
  } = options
  // status === Ready
  try {
    let result = nodeImplementation.prerun ? nodeImplementation.prerun({
      context,
      args,
      initNext: () => {},
    }) : true
    nodeInstance.returnValue = result
    nodeInstance.status = ActivityStatus.Active
    // status === Active
    return true
  } catch (e) {
    if (e instanceof Error) {
      nodeInstance.returnValue = { error: { name: e.name, message: e.message } }
    } else {
      throw e
    }
    // status === Ready
    return false
  }
}

export function executeNodeRun(options: {
  nodeInstance: FlowElementInstance,
  nodeImplementation: NodeImplementation,
  context: RunContext,
  args: any,
}): boolean {
  const {
    nodeInstance,
    nodeImplementation,
    context,
    args,
  } = options
  // status === Active
  try {
    let result = nodeImplementation.run({
      context,
      args,
      initNext: () => { },
    })
    nodeInstance.status = ActivityStatus.Compensating
    nodeInstance.returnValue = result
    // status === Completing
    return true
  } catch (e) {
    nodeInstance.status = ActivityStatus.Falling
    if (e instanceof Error) {
      nodeInstance.returnValue = { error: { name: e.name, message: e.message } }
    } else {
      throw e
    }
    // status === Falling
    return false
  }

}

export function executeNode(options: {
  nodeInstance: FlowElementInstance,
  nodeImplementation: NodeImplementation,
  context: RunContext,
  args: any,
}) {
  const { nodeInstance, args, nodeImplementation, context } = options

  // taskInstance.status === Ready
  if (executeNodePrerun({ nodeInstance, args, context, nodeImplementation })) {
    // status === Active
    if (executeNodeRun({ nodeInstance, args, context, nodeImplementation })) {
      // status === completing
      if (typeof nodeImplementation.onCompleting === 'function') {
        // TODO - dovymislet onCompleting()
        nodeImplementation.onCompleting({
          context: context,
          args: args,
          initNext: () => {},
        })
      }
      nodeInstance.status = ActivityStatus.Completed
      // status === completed
    } else {
      // status === Failing
      if (typeof nodeImplementation.onFailing === 'function') {
        // TODO - dovymislet onFailing()
        nodeImplementation.onFailing({
          context: context,
          args: args,
          initNext: () => { },
        })
      }
      nodeInstance.status = ActivityStatus.Failled
      // status === Failed
    }
  } else {
    // status === Ready
    nodeInstance.status = ActivityStatus.Ready
    // status === Ready
  }
}
