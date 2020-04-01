import { NodeImplementation } from '../bpmnRunner'
import { Task } from './task'

type ExpectedArgs = { state: 'completed'|'storno' }
const ExtectedStateValues = ['completed', 'storno']
/**
 *
 */
export const ManualTask: NodeImplementation = {
  additionsFormat() {
    let expected = { state: ['completed', 'storno'] }
    return {
      state: {
        hints: '',
        type: 'select',
        possibilities: ExtectedStateValues,
      },
    }
  },
  // A) Zkontrolovat stav v datech udalosti
  prerun({ context }) {
    let data = context.$LOCAL as ExpectedArgs | undefined
    if (data) {
      if (ExtectedStateValues.includes(data.state)) {
        return
      }
    }
    throw new Error('Manualni uloha nebyla potvrzena ani zrusena.')
  },
  run({ context }) {
    const defaultOutputPropState = '_state'
    for (let key in context.$OUTPUT) {
      if (context.$OUTPUT[key]) {
        try {
          let keys = Object.keys(context.$OUTPUT[key])
          if (keys.includes(defaultOutputPropState)) {
            let data = context.$LOCAL as ExpectedArgs
            context.$OUTPUT[key][defaultOutputPropState] = data.state
          }
        } catch {}
      }
    }
  },
  onCompleting(options) {
    Task.onCompleting && Task.onCompleting(options)
  },
}
