///////////////////////////////////////
// Soubor: src/bpmnRunnerPlugins/evalExpressionHelper.ts
// Projekt: MWEServer
// Autor: Miroslav Válka
///////////////////////////////////////
import { VM } from 'vm2'

import { RunContext } from '../bpmnRunner'

/**
 * Pomocna funkce pro vyhodnocovani vyrazu.
 */
export function evalExpression(options: {
  context: RunContext,
  expression: string,
}): boolean {
  const { context, expression } = options
  // console.log('EXP:', expression)
  // console.log('CONTEXT:', context)
  const vm = new VM({
    timeout: 1000,
    eval: false,
    sandbox: context,
  })
  try {
  let result = vm.run(expression)
  // console.log('CONTEXT2:', context)
  // console.log('RES:', result)
  return !!result
  } catch (e) {
  // console.log('CONTEXT2:', context)
  console.error('ERR:', e)
    throw e
  }
}
