import { VM } from 'vm2'

import { NodeImplementation } from '../bpmnRunner'
import { Task } from './task'

/**
 * ScriptTask je uloha, ktera provede skript.
 */
export const ScriptTask: NodeImplementation = {
  run({ context }) {
    const { script, scriptFormat = 'js' } = context.$LOCAL

    if (typeof script !== 'string') {
      throw new Error('Skript nenalezen.')
    } else if (typeof scriptFormat !== 'string') {
      throw new Error(`Nevhodny vstup pro skriptFormat.`)
    } else if (!['js', 'JS', 'javascript', 'JavaScript'].includes(scriptFormat)) {
      throw new Error(`Neznami format skriptu '${scriptFormat}'.`)
    }
    // console.log('SCRIPT TASK CTX:', context)
    const vm = new VM({
      sandbox: context,
      timeout: 1000,
      eval: false,
    })
    let result = vm.run(script)
    // console.log('SCRIPT TASK CTX2:', context)
    return result
  },
  onCompleting(options) {
    Task.onCompleting && Task.onCompleting(options)
  },
}
