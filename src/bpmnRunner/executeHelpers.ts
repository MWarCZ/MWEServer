import { ActivityStatus, NodeElementInstance } from '../entity/bpmn'
import { JsonMap } from '../types/json'
import { NodeImplementation } from './pluginNodeImplementation'
import { RunContext } from './runContext'


/**
 *
 * @returns Vraci `true` pokud vse probeho OK nebo v pripade chyby vraci `false`.
 */
export function executeNodePrerun(options: {
  nodeInstance: NodeElementInstance,
  nodeImplementation: NodeImplementation,
  context: RunContext,
  args: JsonMap,
  initNext: (x: any) => void,
  finishProcess: (x: any) => void,
}): boolean {
  const {
    nodeInstance,
    nodeImplementation,
    context,
    args,
    initNext,
    finishProcess,
  } = options
  // status === Ready
  try {
    let result = nodeImplementation.prerun ? nodeImplementation.prerun({
      context,
      args,
      initNext,
      finishProcess,
    }) : true
    // nodeInstance.returnValue = result
    nodeInstance.returnValue = context.$OUTPUT
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
  nodeInstance: NodeElementInstance,
  nodeImplementation: NodeImplementation,
  context: RunContext,
  args: JsonMap,
  initNext: (x:any) => void,
  finishProcess: (x:any) => void,
}): boolean {
  const {
    nodeInstance,
    nodeImplementation,
    context,
    args,
    initNext,
    finishProcess,
  } = options
  // status === Active
  try {
    let result = nodeImplementation.run({
      context,
      args,
      initNext,
      finishProcess,
    })
    nodeInstance.returnValue = context.$OUTPUT
    nodeInstance.status = ActivityStatus.Completing
    // nodeInstance.returnValue = result
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
  nodeInstance: NodeElementInstance,
  nodeImplementation: NodeImplementation,
  context: RunContext,
  args: JsonMap,
}) {
  const { nodeInstance, args, nodeImplementation, context } = options
  let returnValues: {
    // Seznam obsahujici id sequenceFlow, ktere maji byt provedeny.
    initNext: number[],
    // Informace o ukoceni procesu.
    finishProcess: { finished: boolean, forced: boolean, },
    outputs?: JsonMap,
  } = {
    initNext: [],
    finishProcess: { finished: false, forced: false },
  }

  // Pomocna funkce (callback), ktera pridava id sequenceFlow do seznamu pro provedeni.
  const initNext = (sequenceIds: (number | { id: number })[]) => {
    let ids = sequenceIds.map(seq => typeof seq === 'number' ? seq : seq.id)
    returnValues.initNext.push(...ids)
  }
  // Pomocna funkce (callback), pro nastaveni priznaku pro pripadny konec procesu.
  const finishProcess = (options?: { forced: boolean }) => {
    returnValues.finishProcess.finished = true
    if (options) {
      returnValues.finishProcess.forced = !!options.forced
    }
  }

  // taskInstance.status === Ready
  if (executeNodePrerun({ nodeInstance, args, context, nodeImplementation, initNext, finishProcess })) {
    // status === Active
    if (executeNodeRun({ nodeInstance, args, context, nodeImplementation, initNext, finishProcess })) {
      // status === completing
      if (typeof nodeImplementation.onCompleting === 'function') {
        // TODO - dovymislet onCompleting()
        nodeImplementation.onCompleting({
          context: context,
          args: args,
          initNext,
          finishProcess,
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
          finishProcess,
        })
      }
      nodeInstance.status = ActivityStatus.Failled
      // status === Failed
    }
    nodeInstance.endDateTime = new Date()
  } else {
    // status === Ready
    nodeInstance.status = ActivityStatus.Waiting
    // status == Waiting
  }
  returnValues.outputs = nodeInstance.returnValue

  return returnValues
}
