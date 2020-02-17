import { RunContext } from 'bpmnRunner/runContext'
import { GatewayType } from 'entity/bpmn'
import { VM } from 'vm2'

import { NodeImplementation } from '../bpmnRunner'

interface GatewayImplementationArgs {
  gatewayType: GatewayType,
}


function evalExpression(options: {
  context: RunContext,
  expression: string,
}): boolean {
  const { context, expression } = options
  const vm = new VM({
    timeout: 1000,
    eval: false,
    sandbox: context,
  })
  let result = vm.run(expression)
  return !!result
}

/**
 * Gateway (spojuje vsechny do jedne)
 */
export const gatewayImplementation: NodeImplementation = {
  prerun(options) {
    const {
      gatewayType,
    }: GatewayImplementationArgs = options.args || {}

    switch (gatewayType) {
      case GatewayType.Exclusive:
        if (exclusiveGatewayImplementation.prerun)
          return exclusiveGatewayImplementation.prerun(options)
      case GatewayType.Inclusive:
        if (inclusiveGatewayImplementation.prerun)
          return inclusiveGatewayImplementation.prerun(options)
      case GatewayType.Parallel:
        if (parallelGatewayImplementation.prerun)
          return parallelGatewayImplementation.prerun(options)
      default:
        throw new Error('Neco nesedi.')
    }
  },
  run(options) {
    const {
      gatewayType,
    }: GatewayImplementationArgs = options.args || {}

    switch (gatewayType) {
      case GatewayType.Exclusive:
        if (exclusiveGatewayImplementation.run)
          return exclusiveGatewayImplementation.run(options)
      case GatewayType.Inclusive:
        if (inclusiveGatewayImplementation.run)
          return inclusiveGatewayImplementation.run(options)
      case GatewayType.Parallel:
        if (parallelGatewayImplementation.run)
          return parallelGatewayImplementation.run(options)
      default:
        throw new Error('Neznamy typ brany.')
    }
  },
}

/**
 * Parallel Gateway (AND)
 */
export const parallelGatewayImplementation: NodeImplementation = {
  prerun({ context }) {
    const {
      $INCOMING,
    } = context
    // Vsechny incoming musi biti prichozi
    let result = $INCOMING.reduce((acc, value) => {
      return acc && value.came
    }, true)
    if (!result) {
      throw new Error('Stale cekame na vsechny prichozi.')
    }
    return true
  },
  run({ context, initNext }) {
    // Vyhodnotit podminy odchozich
    const { $OUTGOING } = context
    let selectedOutgoing: number[] = []

    // Vsechny incoming musi biti prichozi
    selectedOutgoing = $OUTGOING.map(v => v.id)
    initNext(selectedOutgoing)

    return true
  },
}

/**
 * Inclusive Gateway (OR)
 */
export const inclusiveGatewayImplementation: NodeImplementation = {
  prerun() {
    return true
  },
  run({ context, initNext }) {
    // Vyhodnotit podminy odchozich
    const { $OUTGOING } = context
    let selectedOutgoing: number[] = []

    // Splustit prvni splnujici vyraz
    if (true) {
      let tmp = $OUTGOING.find(value => {
        let { expression = 'true' } = value
        let result = evalExpression({ expression, context })
        return result
      })
      selectedOutgoing = (tmp) ? [tmp.id] : []
    }
    initNext(selectedOutgoing)

    return true
  },
}

/**
 * Exclusive Gateway (XOR)
 */
export const exclusiveGatewayImplementation: NodeImplementation = {
  prerun() {
    return true
  },
  run({ context, initNext }) {
    // Vyhodnotit podminy odchozich
    const { $OUTGOING } = context
    let selectedOutgoing: number[] = []

    // Spustit vse splnujici vyraz
    selectedOutgoing = $OUTGOING.filter(value => {
      let { expression = 'true' } = value
      let result = evalExpression({ expression, context })
      return result
    }).map(v => v.id)
    initNext(selectedOutgoing)

    return true
  },
}
