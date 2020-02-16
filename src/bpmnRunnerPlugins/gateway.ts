import { RunContext } from 'bpmnRunner/runContext'
import { GatewayType } from 'entity/bpmn'
import { VM } from 'vm2'

import { NodeImplementation } from '../bpmnRunner'

interface GatewayImplementationArgs {
  gatewayType: GatewayType,
  // sequenceFlowTemplate.id, sequenceInstnce.templeteId === sequenceFlowTemplate.id
  incoming: { id: number, came: boolean }[],
  // sequenceFlowTemplate.id, sequenceFlowTemplate.expressin
  outgoing: { id: number, expression: string }[]
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
 * Gateway
 */
export const gatewayImplementation: NodeImplementation = {
  prerun({ args }) {
    const {
      gatewayType,
      incoming = [],
      outgoing = [],
    }: GatewayImplementationArgs = args || {}
    switch (gatewayType) {
      case GatewayType.Exclusive:
      case GatewayType.Inclusive:
        break
      case GatewayType.Parallel:
        // Vsechny incoming musi biti prichozi
        let result = incoming.reduce((acc, value) => {
          return acc && value.came
        }, true)
        if (!result) {
          throw new Error('Stale cekame na vsechny prichozi.')
        }
        break
      default:
        throw new Error('Neznamy typ brany.')
    }
    return true
  },
  run({ context, args, initNext }) {
    // Vyhodnotit podminy odchozich
    const {
      gatewayType,
      outgoing = [],
    }: GatewayImplementationArgs = args || {}
    let selectedOutgoing: number[] = []
    switch (gatewayType) {
      case GatewayType.Exclusive:
        // Spustit vse splnujici vyraz
        selectedOutgoing = outgoing.filter(value => {
          let { expression = 'true' } = value
          let result = evalExpression({ expression, context })
          return result
        }).map(v => v.id)
        initNext(selectedOutgoing)
        break
      case GatewayType.Inclusive:
        // Splustit prvni splnujici vyraz
        if (true) {
          let tmp = outgoing.find(value => {
            let { expression = 'true' } = value
            let result = evalExpression({ expression, context })
            return result
          })
          selectedOutgoing = (tmp) ? [tmp.id] : []
        }
        initNext(selectedOutgoing)
        break
      case GatewayType.Parallel:
        // Vsechny incoming musi biti prichozi
        selectedOutgoing = outgoing.map(v => v.id)
        initNext(selectedOutgoing)
        break
      default:
        throw new Error('Neznamy typ brany.')
    }
    return true
  },
}
