import { VM } from 'vm2'

import { RunContext } from '../bpmnRunner'

export function evalExpression(options: {
  context: RunContext,
  expression: string,
}): boolean {
  const { context, expression } = options
  console.log('EXP:', expression)
  // console.log('CONTEXT:', context)
  const vm = new VM({
    timeout: 1000,
    eval: false,
    sandbox: context,
  })
  try {
  let result = vm.run(expression)
  // console.log('CONTEXT2:', context)
  console.log('RES:', result)
  return !!result
  } catch (e) {
  console.log('CONTEXT2:', context)
  console.log('ERR:', e)
    throw e
  }
}
