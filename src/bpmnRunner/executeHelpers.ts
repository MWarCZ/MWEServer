import { ActivityStatus, NodeElementInstance } from '../entity/bpmn'
import { Json, JsonMap } from '../types/json'
import { NodeImplementation, NodeImplementationFnRegister } from './pluginNodeImplementation'
import { RunContext } from './runContext'


/**
 *
 * @returns Vraci `true` pokud vse probeho OK nebo v pripade chyby vraci `false`.
 */
export function safeExecuteNodeFunction(options: {
  nodeInstance: NodeElementInstance,
  executeFunction?: (args: any) => any,
  executeFunctionArgs: {
    context: RunContext,
    fn: NodeImplementationFnRegister,
  },
  status: {
    onSuccess: ActivityStatus,
    onFailure: ActivityStatus,
  },
}): boolean {
  const {
    nodeInstance,
    executeFunction,
    executeFunctionArgs,
    status,
  } = options
  try {
    let result = executeFunction ? executeFunction(executeFunctionArgs) : true
    nodeInstance.returnValue = executeFunctionArgs.context.$OUTPUT
    nodeInstance.status = status.onSuccess
    return true
  } catch (e) {
    let lastStatus = nodeInstance.status || ActivityStatus.None
    nodeInstance.status = status.onFailure
    if (e instanceof Error) {
      nodeInstance.returnValue = { error: { name: e.name, message: e.message, lastStatus } }
    } else {
      throw e
    }
    return false
  }
}

export function executeNodePrerun(options: {
  nodeInstance: NodeElementInstance,
  nodeImplementation: NodeImplementation,
  executeArgs: {
    context: RunContext,
    fn: NodeImplementationFnRegister,
  },
}) {
  return safeExecuteNodeFunction({
    nodeInstance: options.nodeInstance,
    status: {
      onSuccess: ActivityStatus.Active,
      onFailure: ActivityStatus.Waiting,
    },
    executeFunction: options.nodeImplementation.prerun,
    executeFunctionArgs: options.executeArgs,
  })
}
export function executeNodeRun(options: {
  nodeInstance: NodeElementInstance,
  nodeImplementation: NodeImplementation,
  executeArgs: {
    context: RunContext,
    fn: NodeImplementationFnRegister,
  },
}) {
  return safeExecuteNodeFunction({
    nodeInstance: options.nodeInstance,
    status: {
      onSuccess: ActivityStatus.Completing,
      onFailure: ActivityStatus.Falling,
    },
    executeFunction: options.nodeImplementation.run,
    executeFunctionArgs: options.executeArgs,
  })
}
export function executeNodeOnCompleting(options: {
  nodeInstance: NodeElementInstance,
  nodeImplementation: NodeImplementation,
  executeArgs: {
    context: RunContext,
    fn: NodeImplementationFnRegister,
  },
}) {
  return safeExecuteNodeFunction({
    nodeInstance: options.nodeInstance,
    status: {
      onSuccess: ActivityStatus.Completed,
      onFailure: ActivityStatus.Falling,
    },
    executeFunction: options.nodeImplementation.onCompleting,
    executeFunctionArgs: options.executeArgs,
  })
}
export function executeNodeOnFailing(options: {
  nodeInstance: NodeElementInstance,
  nodeImplementation: NodeImplementation,
  executeArgs: {
    context: RunContext,
    fn: NodeImplementationFnRegister,
  },
}) {
  return safeExecuteNodeFunction({
    nodeInstance: options.nodeInstance,
    status: {
      onSuccess: ActivityStatus.Failled,
      onFailure: ActivityStatus.Failled,
    },
    executeFunction: options.nodeImplementation.onFailing,
    executeFunctionArgs: options.executeArgs,
  })
}

// ==========================
/**
 * @throws Pokud nastane chyba pri volani implementace onFailing, onCompleting.
 * @returns Vraci seznam s SequenceFlow.id, ktere maji byti provedeny.
 */
export function executeNode(options: {
  nodeInstance: NodeElementInstance,
  nodeImplementation: NodeImplementation,
  context: RunContext,
}) {
  const { nodeInstance, nodeImplementation, context } = options
  let returnValues: {
    // Seznam obsahujici id sequenceFlow, ktere maji byt provedeny.
    initNext: number[],
    // Informace o ukoceni procesu.
    finishProcess: { finished: boolean, forced: boolean },
    registerGlobal: JsonMap,
    registerLocal: JsonMap,
    outputs?: JsonMap,
  } = {
    initNext: [],
    finishProcess: { finished: false, forced: false },
    registerGlobal: {},
    registerLocal: {},
  }

  const fn: NodeImplementationFnRegister = {
    // Pomocna funkce (callback), ktera pridava id sequenceFlow do seznamu pro provedeni.
    initNext: (sequenceIds: (number | { id: number })[]) => {
      let ids = sequenceIds.map(seq => typeof seq === 'number' ? seq : seq.id)
      returnValues.initNext.push(...ids)
    },
    // Pomocna funkce (callback), pro nastaveni priznaku pro pripadny konec procesu.
    finishProcess: (options?: { forced: boolean }) => {
      returnValues.finishProcess.finished = true
      if (options) {
        returnValues.finishProcess.forced = !!options.forced
      }
    },
    // Pomocna funkce, pro nastaveni/registraci novych dat do instance procesu.
    registerGlobal: (name: string, data?: Json) => {
      if (typeof data !== 'undefined') {
        returnValues.registerGlobal[name] = data
      } else {
        delete returnValues.registerGlobal[name]
      }
    },
    // Pomocna funkce, pro nastaveni/registraci novych dat do instance procesu.
    registerLocal: (name: string, data?: Json) => {
      if (typeof data !== 'undefined') {
        returnValues.registerLocal[name] = data
      } else {
        delete returnValues.registerLocal[name]
      }
    },
  }

  // status === Ready
  let resultPrerun: boolean = false
  let resultRun: boolean = false
  let resultOnCompleting: boolean = false
  let resultOnFailing: boolean = false

  resultPrerun = executeNodePrerun({
    nodeInstance,
    nodeImplementation,
    executeArgs: {
      context,
      fn,
    },
  })
  // status = Active x Waiting
  if (resultPrerun) {
    // status === Actiove
    resultRun = executeNodeRun({
      nodeInstance,
      nodeImplementation,
      executeArgs: {
        context,
        fn,
      },
    })
    // status = Completing x Failing
    if (resultRun) {
      // status === Completing
      resultOnCompleting = executeNodeOnCompleting({
        nodeInstance,
        nodeImplementation,
        executeArgs: {
          context,
          fn,
        },
      })
      // status = Completed x Failing
    }
    if (!resultRun || !resultOnCompleting) {
      // staus === Failing
      resultOnFailing = executeNodeOnFailing({
        nodeInstance,
        nodeImplementation,
        executeArgs: {
          context,
          fn,
        },
      })
      // status = Failed
    }
    nodeInstance.endDateTime = new Date()
  }
  returnValues.outputs = nodeInstance.returnValue

  return returnValues
}
