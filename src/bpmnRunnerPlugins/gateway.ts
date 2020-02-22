import { VM } from 'vm2'

import { NodeImplementation } from '../bpmnRunner'
import { RunContext } from '../bpmnRunner/runContext'


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

    console.warn('AND>', $OUTGOING)

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
    console.warn('XOR>', $OUTGOING)
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

    console.warn('XOR>',$OUTGOING)
    initNext(selectedOutgoing)

    return true
  },
}
