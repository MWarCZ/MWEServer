import { VM } from 'vm2'

import { NodeImplementation } from '../bpmnRunner'

/**
 * ScriptTask je uloha, ktera provede skript.
 */
export const scriptTaskImplementation: NodeImplementation = {
  run({ context, args }) {
    const {
      script,
      scriptFormat = 'js',
    }: { script: string, scriptFormat?: string } = args || {}
    if (typeof script !== 'string') {
      throw new Error('Skript nenalezen.')
    } else if (!['js', 'JS', 'javascript', 'JavaScript'].includes(scriptFormat)) {
      throw new Error('Neznami format skriptu.')
    }
    const vm = new VM({
      sandbox: context,
      timeout: 1000,
      eval: false,
    })
    let result = vm.run(script)
    return result
  },
  onCompleting({initNext, context}) {
    initNext(context.$OUTGOING)
  },
}
