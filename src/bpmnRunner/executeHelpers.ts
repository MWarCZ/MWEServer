import { ActivityStatus, NodeElementInstance } from '../entity/bpmn'
import { Json, JsonMap } from '../types/json'
import { NodeImplementation } from './pluginNodeImplementation'
import { RunContext } from './runContext'


/**
 *
 * @returns Vraci `true` pokud vse probeho OK nebo v pripade chyby vraci `false`.
 */
export function executeNodePrerunX(options: {
  nodeInstance: NodeElementInstance,
  nodeImplementation: NodeImplementation,
  context: RunContext,
  args: JsonMap,
  initNext: (x: any) => void,
  finishProcess: (x: any) => void,
  registerData: (x: string, y: any) => void,
}): boolean {
  const {
    nodeInstance,
    nodeImplementation,
    context,
    args,
    initNext,
    finishProcess,
    registerData,
  } = options
  // status === Ready
  try {
    let result = nodeImplementation.prerun ? nodeImplementation.prerun({
      context,
      args,
      initNext,
      finishProcess,
      registerData,
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
export function executeNodeRunX(options: {
  nodeInstance: NodeElementInstance,
  nodeImplementation: NodeImplementation,
  context: RunContext,
  args: JsonMap,
  initNext: (x:any) => void,
  finishProcess: (x:any) => void,
  registerData: (x:string, y:any) => void,
}): boolean {
  const {
    nodeInstance,
    nodeImplementation,
    context,
    args,
    initNext,
    finishProcess,
    registerData,
  } = options
  // status === Active
  try {
    let result = nodeImplementation.run({
      context,
      args,
      initNext,
      finishProcess,
      registerData,
    })
    nodeInstance.returnValue = context.$OUTPUT
    nodeInstance.status = ActivityStatus.Completing
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

// ==============================
/**
 *
 * @returns Vraci `true` pokud vse probeho OK nebo v pripade chyby vraci `false`.
 */
export function safeExecuteNodeFunction(options: {
  nodeInstance: NodeElementInstance,
  executeFunction?: (args: any) => any,
  executeFunctionArgs: {
    context: RunContext,
    args: JsonMap,
    initNext: (x: any) => void,
    finishProcess: (x: any) => void,
    registerData: (x: string, y: any) => void,
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
    args: JsonMap,
    initNext: (x: any) => void,
    finishProcess: (x: any) => void,
    registerData: (x: string, y: any) => void,
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
    args: JsonMap,
    initNext: (x: any) => void,
    finishProcess: (x: any) => void,
    registerData: (x: string, y: any) => void,
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
    args: JsonMap,
    initNext: (x: any) => void,
    finishProcess: (x: any) => void,
    registerData: (x: string, y: any) => void,
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
    args: JsonMap,
    initNext: (x: any) => void,
    finishProcess: (x: any) => void,
    registerData: (x: string, y: any) => void,
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
  args: JsonMap,
}) {
  const { nodeInstance, args, nodeImplementation, context } = options
  let returnValues: {
    // Seznam obsahujici id sequenceFlow, ktere maji byt provedeny.
    initNext: number[],
    // Informace o ukoceni procesu.
    finishProcess: { finished: boolean, forced: boolean },
    registerData: JsonMap,
    outputs?: JsonMap,
  } = {
    initNext: [],
    finishProcess: { finished: false, forced: false },
    registerData: {},
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
  // Pomocna funkce, pro nastaveni/registraci novych dat do instance procesu.
  const registerData = (name: string, data: Json) => {
    if (data) {
      returnValues.registerData[name] = data
    } else {
      delete returnValues.registerData[name]
    }
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
      args,
      context,
      initNext,
      finishProcess,
      registerData,
    },
  })
  // status = Active x Waiting
  if (resultPrerun) {
    // status === Actiove
    resultRun = executeNodeRun({
      nodeInstance,
      nodeImplementation,
      executeArgs: {
        args,
        context,
        initNext,
        finishProcess,
        registerData,
      },
    })
    // status = Completing x Failing
    if (resultRun) {
      // status === Completing
      resultOnCompleting = executeNodeOnCompleting({
        nodeInstance,
        nodeImplementation,
        executeArgs: {
          args,
          context,
          initNext,
          finishProcess,
          registerData,
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
          args,
          context,
          initNext,
          finishProcess,
          registerData,
        },
      })
      // status = Failed
    }
  }
  returnValues.outputs = nodeInstance.returnValue

  return returnValues
}
