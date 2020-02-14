import 'jest-extended'

import { createEmptyContext } from '../../src/bpmnRunner/runContext'
import { taskImplementation } from '../../src/bpmnRunnerPlugins/task'

describe('Test zakladni implamantace ulohy', ()=>{
  it('taskImplementation', () => {
    expect(taskImplementation).toBeObject()
    expect(taskImplementation.prerun).toBeUndefined()
    expect(taskImplementation.run).toBeFunction()
    let result = taskImplementation.run(createEmptyContext())
    expect(result).toBeTrue()
  })
})
