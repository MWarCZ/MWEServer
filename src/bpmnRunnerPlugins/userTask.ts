import { NodeImplementation, NodeImplementationFlatItemsMap } from '../bpmnRunner/pluginsImplementation'
import { RunContextMap } from '../bpmnRunner/runContext'
import { Prop, setDefaultOutputProps } from './setDefaultOutputProps'
import { Task } from './task'

function checkForm(form: any): form is NodeImplementationFlatItemsMap {
  // console.log('#> checkForm:', form)
  if (!form) return false
  if (typeof form !== 'object') return false
  for (let key in form) {
    if (typeof form[key] !== 'object') return false
    if (typeof form[key].type !== 'string') return false
  }
  return true
}
function findForm($local: RunContextMap): NodeImplementationFlatItemsMap {
  // console.log('#> findForm:', $local)
  const defaultForm: NodeImplementationFlatItemsMap = {
    $form_state: { type: 'hidden', default: true, hints: 'Byl formulář vyplněn?' },
  }
  for (let key in $local) {
    const data = $local[key]
    const form = data && data.$form
    if (typeof form === 'object') {
      if (checkForm(form)) {
        return {
          ...form,
          ...defaultForm,
        }
      }
    }
  }
  return {
    $error: { type: 'html', hints: '<b style="color:red;">Nebyl nalezen validní formulář!</b>' },
    ...defaultForm,
  }
}

export const UserTask: NodeImplementation = {
  additionsFormat({ context }) {
    console.log('USER_TASK: F>')
    const form = findForm(context.$INPUT)
    return form
  },

  prerun({ context }) {
    let data = context.$LOCAL
    console.log('USER_TASK: prerun>', data)
    if (data) {
      if (data.$form_state) {
        return true
      }
    }
    throw new Error('Nebyla dodana vsechna potrebna data.')
  },

  run({ context }) {
    console.log('USER_TASK: run>')

    const form = findForm(context.$INPUT)
    const props: Prop[] = []
    for (let key in form) {
      let value = context.$LOCAL[key]
      props.push({
        name: key,
        // @ts-ignore
        value: value,
      })
    }

    setDefaultOutputProps({
      context,
      props: [...props],
    })
  },

  onCompleting(options) {
    console.log('USER_TASK: completing>')
    Task.onCompleting && Task.onCompleting(options)
  },
}
