///////////////////////////////////////
// Soubor: src/bpmnRunner/index.ts
// Projekt: MWEServer
// Autor: Miroslav Válka
///////////////////////////////////////
import { ActivityStatus, NodeElementInstance } from '../entity/bpmn'
import { NodeImplementation, NodeImplementationFnRegister, ServiceImplementation } from './pluginsImplementation'
import { RunContext } from './runContext'

/**
 * Funkce pro bezpecne vykonani funkce z implementace uzlu nad instanci uzlu.
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
    if (executeFunction) {
      let result = executeFunction ? executeFunction(executeFunctionArgs) : true
      nodeInstance.returnValue = executeFunctionArgs.context.$OUTPUT
    }
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

/** Vykonani implementace uzlu pro predzpracovani instance uzlu */
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
/** Vykonani implementace uzlu pro zpracovani instance uzlu */
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
/** Vykonani implementace uzlu pro dokonceni instance uzlu */
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
/** Vykonani implementace uzlu pro chybne dokonceni instance uzlu */
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

/** Vykonani implementace uzlu pro doplneni dodatku pro zpracovani instance uzlu */
export function executeNodeAdditions(options: {
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
      onSuccess: ActivityStatus.Ready,
      onFailure: ActivityStatus.Waiting,
    },
    executeFunction: options.nodeImplementation.additions,
    executeFunctionArgs: options.executeArgs,
  })
}

// ==========================
/** Pripraveni funkci a dat z knihovny implementaci sluzeb. */
export function prepareServiceImplementation2Run(options: {
  services: ServiceImplementation[],
}) {
  let queues: { [key: string]: any[] } = {}
  const fn: NodeImplementationFnRegister = {}
  // Mapovani nahradni funkce a zasobnik argumentu.
  for (let service of options.services) {
    queues[service.name] = []
    fn[service.name] = (...args) => {
      queues[service.name].push(args)
    }
  }
  return { queues, fn }
}
/** Vykonani funkci nad daty ziskanymi behem zpracovani uzlu pomoci sluzeb. */
export function callServiceImplementationFunctions(options: {
  services: ServiceImplementation[],
  queues: { [key: string]: any[] },
}) {
  // Volani callbacku z services
  for (let service of options.services) {
    for (let args of options.queues[service.name]) {
      service.fn(...args)
    }
  }
}

// ==========================
export interface TopLevelExecuteFunctionArgs {
  nodeInstance: NodeElementInstance,
  nodeImplementation: NodeImplementation,
  context: RunContext,
  services: ServiceImplementation[],
}

/** Vykonani doplneni dodatku do instance uzlu. */
export function executeAdditons(options: TopLevelExecuteFunctionArgs) {
  const { nodeInstance, nodeImplementation, context, services } = options

  // Pripraveni funkci pro uzly a fronty s daty pro zpetna volani sluzeb.
  const { fn, queues } = prepareServiceImplementation2Run({ services })

  // status === Ready
  let resultAdditions: boolean = false

  resultAdditions = executeNodeAdditions({
    nodeInstance,
    nodeImplementation,
    executeArgs: {
      context,
      fn,
    },
  })

  // Volani callbacku z services
  callServiceImplementationFunctions({ services, queues })

  return nodeInstance.returnValue
}

/** Vykonani zpracovani instance uzlu implementaci. */
export function executeNode(options: TopLevelExecuteFunctionArgs) {
  const { nodeInstance, nodeImplementation, context, services } = options

  // Pripraveni funkci pro uzly a fronty s daty pro zpetna volani sluzeb.
  const { fn, queues } = prepareServiceImplementation2Run({services})

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
  // console.log('000:>>', nodeInstance)
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
    // console.log('111:>>', nodeInstance)

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

  // console.log("AAA:>>", nodeInstance)
  // Volani callbacku z services
  callServiceImplementationFunctions({ services, queues })

  return nodeInstance.returnValue
}
