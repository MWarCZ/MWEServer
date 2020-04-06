import { VM } from 'vm2'

import { RunContext } from '../bpmnRunner'

export function evalExpression(options: {
  context: RunContext,
  expression: string,
}): boolean {
  const { context, expression } = options
  // console.log('CONTEXT:', context)
  const vm = new VM({
    timeout: 1000,
    eval: false,
    sandbox: context,
  })
  let result = vm.run(expression)
  return !!result
}
