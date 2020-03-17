import { NodeImplementation, RunContextOutgoing } from '../bpmnRunner'
import { evalExpression } from './evalExpressionHelper'

/**
 * Task je uloha, ktera se vzdy vykona uspesne.
 * Slouzi prevazne k ladeni.
 */
export const Task: NodeImplementation = {
  run() {
    return true
  },
  onCompleting({ fn, context }) {
    if (!fn.initNext) return

    let outgoings = context.$OUTGOING.reduce((acc, value) => {
      if (value.flag === 'default') {
        acc.default.push(value)
      } else if (value.expression === '') {
        acc.and.push(value)
      } else {
        acc.or.push(value)
      }
      return acc
    }, {
      default: [], or: [], and: [],
    } as {
      default: RunContextOutgoing[], and: RunContextOutgoing[], or: RunContextOutgoing[],
    })
    // Start AND
    if (outgoings.and.length) fn.initNext(outgoings.and)
    // Eval OR
    let founded = outgoings.or.find(value => {
      let { expression = 'true' } = value
      let result = evalExpression({ expression, context })
      return result
    })
    if (founded) {
      // Nalezen povoleny odchozi
      fn.initNext([founded])
    } else {
      // Nenalezen => spust vychozi
      if (outgoings.default.length) fn.initNext(outgoings.default)
    }
  },
}
