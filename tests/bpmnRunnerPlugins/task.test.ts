import 'jest-extended'

import { createEmptyContext } from '../../src/bpmnRunner/runContext'
import { Task } from '../../src/bpmnRunnerPlugins/task'
import { ProcessInstance, ProcessTemplate } from '../../src/entity/bpmn'
import {
  convertInstance2Template,
  convertString2Instance,
  convertString2Template,
  convertTemplate2Instance,
} from '../../src/utils/entityHelpers'

describe(`Test zakladni implamantace ulohy 'taskImplementation'`, () => {
  it('Je objekt definovan spravne dle ocekavani', () => {
    expect(Task).toBeObject()
    expect(Task.prerun).toBeUndefined()
    expect(Task.run).toBeFunction()
    expect(Task.onCompleting).toBeFunction()
    expect(Task.onFailing).toBeUndefined()
  })

  it('Funkce run.', () => {
    let called = {
      initNext: 0,
      finishProcess: 0,
      registerData: 0,
    }
    let context = createEmptyContext()
    let result = Task.run({
      context,
      fn: {
        initNext: (args: any) => { called.initNext++ },
        finishProcess: (args: any) => { called.finishProcess++ },
        registerData: (args: any) => { called.registerData++ },
      },
    })
    expect(result).toBeTrue()
    expect(called.initNext).toBe(0)
    expect(called.finishProcess).toBe(0)
    expect(called.registerData).toBe(0)
  })

  describe('Funkce onCompleting:', () => {
    it.each([
      ['0x outgoing => 0x OK, 0x KO',
        [],
        { initNext: 0, finishProcess: 0, registerData: 0 },
        (item: any) => true,
      ],
      ['1x outgoing (typ AND) => 1x OK, 0x KO',
        [
          { id: 11, expression: '', flag: '' },
        ],
        { initNext: 1, finishProcess: 0, registerData: 0 },
        (item: any) => true,
      ],
      ['4x outgoing (typ AND) => 4x OK, 0x KO',
        [
          { id: 11, expression: '', flag: '' },
          { id: 22, expression: '', flag: '' },
          { id: 33, expression: '', flag: '' },
          { id: 44, expression: '', flag: '' },
        ],
        { initNext: 4, finishProcess: 0, registerData: 0 },
        (item: any) => true,
      ],
      [ '1x outgoing (typ OR) => 1x OK, 0x KO',
        [
          { id: 11, expression: 'true', flag: '' },
        ],
        { initNext: 1, finishProcess: 0, registerData: 0 },
        (item: any) => true,
      ],
      ['3x outgoing (typ OR) => 1x OK, 1x KO',
        [
          { id: 11, expression: 'false', flag: '' },
          { id: 22, expression: 'true', flag: '' },
          { id: 33, expression: 'true', flag: '' },
        ],
        { initNext: 1, finishProcess: 0, registerData: 0 },
        (item: any) => item.id === 22,
      ],
      ['3x outgoing (typ OR) => 1x OK, 2x KO',
        [
          { id: 11, expression: 'false', flag: '' },
          { id: 22, expression: 'false', flag: '' },
          { id: 33, expression: 'true', flag: '' },
        ],
        { initNext: 1, finishProcess: 0, registerData: 0 },
        (item: any) => item.id === 33,
      ],
      ['1x outgoing (typ default) => 1x OK, 0x KO',
        [
          { id: 11, expression: '', flag: 'default' },
        ],
        { initNext: 1, finishProcess: 0, registerData: 0 },
        (item: any) => true,
      ],
      ['3x outgoing (typ default) => 3x OK, 0x KO',
        [
          { id: 11, expression: '', flag: 'default' },
          { id: 22, expression: '', flag: 'default' },
          { id: 33, expression: '', flag: 'default' },
        ],
        { initNext: 3, finishProcess: 0, registerData: 0 },
        (item: any) => true,
      ],
      ['5x outgoing (typ OR+default) => 1x OK, 4x KO (defalut)',
        [
          { id: 11, expression: 'false', flag: '' },
          { id: 22, expression: 'false', flag: '' },
          { id: 33, expression: '', flag: 'default' },
          { id: 44, expression: 'false', flag: '' },
          { id: 55, expression: 'false', flag: '' },
        ],
        { initNext: 1, finishProcess: 0, registerData: 0 },
        (item: any) => [33].includes(item.id),
      ],
      ['5x outgoing (typ OR+default) => 1x OK, 2x KO (true: 1xOR)',
        [
          { id: 11, expression: 'false', flag: '' },
          { id: 22, expression: 'false', flag: '' },
          { id: 33, expression: '', flag: 'default' },
          { id: 44, expression: 'true', flag: '' },
          { id: 55, expression: 'false', flag: '' },
        ],
        { initNext: 1, finishProcess: 0, registerData: 0 },
        (item: any) => [44].includes(item.id),
      ],
      ['5x outgoing (typ OR+default) => 1x OK, 1x KO (true: 2xOR)',
        [
          { id: 11, expression: 'false', flag: '' },
          { id: 22, expression: 'true', flag: '' },
          { id: 33, expression: '', flag: 'default' },
          { id: 44, expression: 'true', flag: '' },
          { id: 55, expression: 'false', flag: '' },
        ],
        { initNext: 1, finishProcess: 0, registerData: 0 },
        (item: any) => [22].includes(item.id),
      ],
      ['6x outgoing (typ AND+OR+default) => 3x OK, 1x KO',
        [
          { id: 11, expression: '', flag: '' },
          { id: 22, expression: 'false', flag: '' },
          { id: 33, expression: '', flag: 'default' },
          { id: 44, expression: '', flag: '' },
          { id: 55, expression: 'true', flag: '' },
          { id: 66, expression: 'false', flag: '' },
        ],
        { initNext: 3, finishProcess: 0, registerData: 0 },
        (item: any) => [11, 44, 55].includes(item.id),
      ],
    ])('%s.', (name, outgoing, expSize, expFilter) => {
      let called = {
        initNext: [] as any[],
        finishProcess: [] as any[],
        registerData: [] as any[],
      }
      let context = createEmptyContext()
      context.$OUTGOING.push(...outgoing)

      let result = Task.onCompleting && Task.onCompleting({
        context,
        fn: {
          initNext: (outs: any[]) => { called.initNext.push(...outs) },
          finishProcess: (opts: any) => { called.finishProcess.push(opts) },
          registerData: (name: string, data: any) => { called.registerData.push([name, data]) },
        },
      })
      expect(called.finishProcess).toBeArrayOfSize(expSize.finishProcess)
      expect(called.registerData).toBeArrayOfSize(expSize.registerData)
      expect(called.initNext).toBeArrayOfSize(expSize.initNext)
      expect(called.initNext).toEqual(outgoing.filter(expFilter))
    })
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
  })
})
