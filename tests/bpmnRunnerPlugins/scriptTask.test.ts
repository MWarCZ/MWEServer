import 'jest-extended'

import { createEmptyContext } from '../../src/bpmnRunner/runContext'
import { scriptTaskImplementation as scriptTask } from '../../src/bpmnRunnerPlugins/scriptTask'

describe('Zakladni testy pro scriptTaskImplementation.', ()=>{
  it('Spravnost struktury pluginu.', () => {
    expect(scriptTask).toBeObject()
    expect(scriptTask.prerun).toBeUndefined()
    expect(scriptTask.run).toBeFunction()
  })
  it('Skript obsahuje jednoduchy aritmeticky vyraz.', ()=>{
    let context = createEmptyContext()
    let args = { script: `(5+6*2)*3` }
    let result = scriptTask.run({context, args, initNext: () => { }})
    expect(result).toBe((5 + 6 * 2) * 3)
  })
  it('Skript obsahuje prikaz pro vyhozeni chyby.', () => {
    let context = createEmptyContext()
    let args = { script: `throw new Error('abc')` }
    expect(() => scriptTask.run({ context, args, initNext: () => { }})).toThrowError()
  })
  it('Skript obsahuje jednoduchy aritmeticky vyraz.', () => {
    let context = createEmptyContext()
    let args = { script: `
      function add(x, y) {
        return x+y
      }
      add(11,22)
    ` }
    let result = scriptTask.run({ context, args, initNext: () => { }})
    console.log(result)
    expect(result).toBe(33)
  })

  it('xxx.', () => {
    let context = createEmptyContext()
    let args = {
      script: `
      function add(x, y) {
        return x+y
      }
      $OUTGOING.push(11)
    ` }
    let result = scriptTask.run({ context, args, initNext: () => { } })
    console.log({result, context})
  })

})
