import { ActivityStatus, NodeElementInstance } from '../entity/bpmn'
import { NodeImplementation, NodeImplementationFnRegister, ServiceImplementation } from './pluginsImplementation'
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
  services: ServiceImplementation[],
}) {
  const { nodeInstance, nodeImplementation, context, services } = options

  let queues: { [key: string]: any[] } = {}
  const fn: NodeImplementationFnRegister = {}
  // Mapovani nahradni funkce a zasobnik argumentu.
  for (let service of services) {
    queues[service.name] = []
    fn[service.name] = (...args) => {
      queues[service.name].push(args)
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

  // Volani callbacku z services
  for (let service of services) {
    for (let args of queues[service.name]) {
      service.fn(...args)
    }
  }

  return nodeInstance.returnValue
}


/**
 * Ukazka implementace sluzky se zpetnym volanim.
 * fn: pole obsahujici polozky id nebo objekt s id
 * done: pole obsahujici polozky id
 */
class InitNext implements ServiceImplementation {
  done?: (...ids: number[]) => void
  name = 'initNext'
  fn(...targetIds: (number | { id: number })[]) {
    let ids = targetIds.map(t => typeof t === 'number' ? t : t.id)
    this.done && this.done(...ids)
  }
  constructor(options?: {
    name?: string,
    done?: (...ids: number[]) => void,
  }) {
    let {name, done} = options || {}
    name && (this.name = name)
    done && (this.done = done)
  }
}


function aaa(services: ServiceImplementation[]) {
  let queues: {[key: string]: any[] } = {}
  let fn: Partial<NodeImplementationFnRegister> = {}
  // Mapovani nahradni funkce a zasobnik argumentu.
  for (let service of services) {
    queues[service.name] = []
    fn[service.name] = (...args) => {
      queues[service.name].push(args)
    }
  }
  // run()
  // Volani callbacku z service
  for (let service of services) {
    for (let args of queues[service.name]) {
      service.fn(...args)
    }
  }

}
