import 'jest-extended'

import { createEmptyContext } from '../../src/bpmnRunner/runContext'
import { ScriptTask } from '../../src/bpmnRunnerPlugins/scriptTask'

describe('Zakladni testy pro scriptTaskImplementation.', () => {
  it('Spravnost struktury pluginu.', () => {
    expect(ScriptTask).toBeObject()
    expect(ScriptTask.prerun).toBeUndefined()
    expect(ScriptTask.run).toBeFunction()
  })
  it('Skript obsahuje jednoduchy aritmeticky vyraz.', () => {
    let context = createEmptyContext()
    context.$LOCAL = { script: `(5+6*2)*3` }
    let result = ScriptTask.run({
      context,
      fn: {
        initNext: () => { },
        finishProcess: () => { },
        registerLocal: () => { },
        registerGlobal: () => { },
      },
    })
    expect(result).toBe((5 + 6 * 2) * 3)
  })
  it('Skript obsahuje prikaz pro vyhozeni chyby.', () => {
    let context = createEmptyContext()
    context.$LOCAL = { script: `throw new Error('abc')` }
    expect(() => ScriptTask.run({
      context,
      fn: {
        initNext: () => { },
        finishProcess: () => { },
        registerLocal: () => { },
        registerGlobal: () => { },
      },
    })).toThrowError()
  })
  it('Skript obsahuje jednoduchy aritmeticky vyraz.', () => {
    let context = createEmptyContext()
    context.$LOCAL = { script: `
      function add(x, y) {
        return x+y
      }
      add(11,22)
    ` }
    let result = ScriptTask.run({
      context,
      fn: {
        initNext: () => { },
        finishProcess: () => { },
        registerLocal: () => { },
        registerGlobal: () => { },
      },
    })
    // console.log(result)
    expect(result).toBe(33)
  })

  it('xxx.', () => {
    let context = createEmptyContext()
    context.$LOCAL = {
      script: `
      function add(x, y) {
        return x+y
      }
      $OUTGOING.push(11)
    ` }
    let result = ScriptTask.run({
      context,
      fn: {
        initNext: () => { },
        finishProcess: () => { },
        registerLocal: () => { },
        registerGlobal: () => { },
      },
    })
    // console.log({result, context})
  })

})
