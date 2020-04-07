import { NodeImplementation } from '../bpmnRunner'
import { evalExpression } from './evalExpressionHelper'

/**
 * Parallel Gateway (AND)
 */
export const ParallelGateway: NodeImplementation = {
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
  run({ context, fn }) {
    // Vyhodnotit podminy odchozich
    const { $OUTGOING } = context
    let selectedOutgoing: number[] = []

    console.warn('AND>', $OUTGOING)

    // Vsechny incoming musi biti prichozi
    selectedOutgoing = $OUTGOING.map(v => v.id)
    if (!fn.initNext) return
    fn.initNext(selectedOutgoing)

    return true
  },
}

/**
 * Inclusive Gateway (OR)
 */
export const InclusiveGateway: NodeImplementation = {
  options: {
    scope_inputs: 'global',
  },
  prerun() {
    return true
  },
  run({ context, fn }) {
    // Vyhodnotit podminy odchozich
    const { $OUTGOING } = context
    // let selectedOutgoing: number[] = []

    // Splustit prvni splnujici vyraz
    const defaults = $OUTGOING.filter(o => o.flag === 'default')
    const normals = $OUTGOING.filter(o => o.flag !== 'default')

    const selected = normals.find(value => {
      let { expression = 'true' } = value
      if(expression === '') expression = 'true'
      const result = evalExpression({ expression, context })
      return result
    })
    if(selected) {
      if (!fn.initNext) return
      fn.initNext([selected.id])
    } else {
      let nums = defaults.map(v=>v.id)
      if (!fn.initNext) return
      fn.initNext(nums)
    }

    // if (true) {
    //   let tmp = $OUTGOING.find(value => {
    //     let { expression = 'true' } = value
    //     if (expression === '') expression = 'true'
    //     let result = evalExpression({ expression, context })
    //     return result
    //   })
    //   selectedOutgoing = (tmp) ? [tmp.id] : []
    // }
    // console.warn('OR>', $OUTGOING)
    // if (!fn.initNext) return
    // fn.initNext(selectedOutgoing)

    return true
  },
}

/**
 * Exclusive Gateway (XOR)
 */
export const ExclusiveGateway: NodeImplementation = {
  options: {
    scope_inputs: 'global',
  },
  prerun() {
    return true
  },
  run({ context, fn }) {
    // Vyhodnotit podminy odchozich
    const { $OUTGOING } = context
    let selectedOutgoing: number[] = []

    // Spustit vse splnujici vyraz

    const defaults = $OUTGOING.filter(o => o.flag === 'default')
    const normals = $OUTGOING.filter(o => o.flag !== 'default')

    const selected = normals.filter(value => {
      let { expression = 'true' } = value
      if (expression === '') expression = 'true'
      const result = evalExpression({ expression, context })
      return result
    })

    if (selected.length) {
      selectedOutgoing = selected.map(v => v.id)
    } else {
      selectedOutgoing = defaults.map(v => v.id)
    }
    if (!fn.initNext) return
    fn.initNext(selectedOutgoing)

    // let x = $OUTGOING.filter(value => value.flag='default')
    // selectedOutgoing = $OUTGOING.filter(value => {
    //   let { expression = 'true' } = value
    //   if (expression === '') expression = 'true'
    //   let result = evalExpression({ expression, context })
    //   return result
    // }).map(v => v.id)

    // console.warn('XOR>', $OUTGOING)
    // if (!fn.initNext) return
    // fn.initNext(selectedOutgoing)

    return true
  },
}
