import { ActivityStatus, FlowElementInstance } from '../entity/bpmn'
import { NodeImplementation } from './pluginNodeImplementation'
import { RunContext } from './runContext'


/**
 *
 * @returns Vraci `true` pokud vse probeho OK nebo v pripade chyby vraci `false`.
 */
export function executeNodePrerun(options: {
  nodeInstance: FlowElementInstance,
  nodeImplementation: NodeImplementation,
  context: RunContext,
  args: any,
  initNext: (x:any)=>void,
}): boolean {
  const {
    nodeInstance,
    nodeImplementation,
    context,
    args,
    initNext,
  } = options
  // status === Ready
  try {
    let result = nodeImplementation.prerun ? nodeImplementation.prerun({
      context,
      args,
      initNext,
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

/**
 *
 * @returns Vraci `true` pokud vse probeho OK nebo v pripade chyby vraci `false`.
 */
export function executeNodeRun(options: {
  nodeInstance: FlowElementInstance,
  nodeImplementation: NodeImplementation,
  context: RunContext,
  args: any,
  initNext: (x:any) => void,
}): boolean {
  const {
    nodeInstance,
    nodeImplementation,
    context,
    args,
    initNext,
  } = options
  // status === Active
  try {
    let result = nodeImplementation.run({
      context,
      args,
      initNext,
    })
    nodeInstance.status = ActivityStatus.Completing
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

/**
 * @throws Pokud nastane chyba pri volani implementace onFailing, onCompleting.
 * @returns Vraci seznam s SequenceFlow.id, ktere maji byti provedeny.
 */
export function executeNode(options: {
  nodeInstance: FlowElementInstance,
  nodeImplementation: NodeImplementation,
  context: RunContext,
  args: any,
}): number[] {
  const { nodeInstance, args, nodeImplementation, context } = options
  // Seznam obsahujici id sequenceFlow, ktere maji byt provedeny.
  const listOfinitNext: number[] = []
  // Pomocna funkce (callback), ktera pridava id sequenceFlow do seznamu pro provedeni.
  const initNext = (sequenceIds: (number | { id: number })[]) => {
    let ids = sequenceIds.map(seq=>typeof seq === 'number' ? seq : seq.id)
    listOfinitNext.push(...ids)
  }

  // taskInstance.status === Ready
  if (executeNodePrerun({ nodeInstance, args, context, nodeImplementation, initNext, })) {
    // status === Active
    if (executeNodeRun({ nodeInstance, args, context, nodeImplementation, initNext, })) {
      // status === completing
      if (typeof nodeImplementation.onCompleting === 'function') {
        // TODO - dovymislet onCompleting()
        nodeImplementation.onCompleting({
          context: context,
          args: args,
          initNext,
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
          initNext,
        })
      }
      nodeInstance.status = ActivityStatus.Failled
      // status === Failed
    }
  } else {
    // status === Ready
    nodeInstance.status = ActivityStatus.Ready
    // TODO Zauvazovat zda nepridat novy stav Waiting // status = Waiting
    //      stejne jako Ready jen s rozlisenim Ready - ceka na zpracovani,
    //      Waiting - ceka na podminku pred zpracovanim.
    // status === Ready
  }
  return listOfinitNext
}
