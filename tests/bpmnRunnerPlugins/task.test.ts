import 'jest-extended'

import { createEmptyContext } from '../../src/bpmnRunner/runContext'
import { taskImplementation } from '../../src/bpmnRunnerPlugins/task'
import { ProcessInstance, ProcessTemplate } from '../../src/entity/bpmn'
import {
  convertInstance2Template,
  convertString2Instance,
  convertString2Template,
  convertTemplate2Instance,
} from '../../src/utils/entityHelpers'

describe('Test zakladni implamantace ulohy', () => {
  it('taskImplementation', () => {
    expect(taskImplementation).toBeObject()
    expect(taskImplementation.prerun).toBeUndefined()
    expect(taskImplementation.run).toBeFunction()
    let result = taskImplementation.run({
      context: createEmptyContext(),
      initNext: () => {},
      finishProcess: () => { },
      registerData: () => { },
    })
    expect(result).toBeTrue()
  })
  it('err', () => {
    let i = convertTemplate2Instance(ProcessTemplate)
    let t = (i) ? convertInstance2Template(i) : undefined
    let si = convertString2Instance(i && i.name || '')
    let st = convertString2Template(t && t.name || '')
    expect(i).toBe(ProcessInstance)
    expect(t).toBe(ProcessTemplate)
    expect(si).toBe(ProcessInstance)
    expect(st).toBe(ProcessTemplate)
    console.log('aaaaaaaaa')
      // throw new Error('xxxx')
  })
})
