import { NodeImplementation } from '../bpmnRunner'
import { setDefaultOutputProps } from './setDefaultOutputProps'
import { Task } from './task'

type ExpectedArgs = { state: 'completed'|'storno' }
const ExtectedStateValues = ['completed', 'storno']
/**
 *
 */
export const ManualTask: NodeImplementation = {
  additionsFormat() {
    console.log('MANUAL_TASK: F>')
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
    console.log('MANUAL_TASK: prerun>', data)
    if (data) {
      if (ExtectedStateValues.includes(data.state)) {
        return true
      }
    }
    throw new Error('Manualni uloha nebyla potvrzena ani zrusena.')
  },
  run({ context }) {
    console.log('MANUAL_TASK: run>')
    const defaultOutputPropState = '_state'

    const localData = context.$LOCAL as ExpectedArgs

    setDefaultOutputProps({
      context,
      props: [
        { name: '_state', value: localData.state}
      ],
    })

    // for (let key in context.$OUTPUT) {
    //   if (context.$OUTPUT[key]) {
    //     try {
    //       let keys = Object.keys(context.$OUTPUT[key])
    //       if (keys.includes(defaultOutputPropState)) {
    //         let data = context.$LOCAL as ExpectedArgs
    //         context.$OUTPUT[key][defaultOutputPropState] = data.state
    //       }
    //     } catch { }
    //   }
    // }
  },
  onCompleting(options) {
    console.log('MANUAL_TASK: completing>')
    Task.onCompleting && Task.onCompleting(options)
  },
}
