import 'jest-extended'

import { executeNode } from '../../src/bpmnRunner/executeHelpers'
import { NodeImplementation } from '../../src/bpmnRunner/pluginNodeImplementation'
import { createEmptyContext, RunContext } from '../../src/bpmnRunner/runContext'
import { ActivityStatus, FlowElementInstance, TaskInstance } from '../../src/entity/bpmn'


describe('Testy behove pipeline-y.', ()=>{

  describe('executeNode: Testy s prazndym kontextem a argumenty.', () => {
    let context: RunContext
    let args: any
    let nodeInstance: FlowElementInstance
    let nodeImplementation: NodeImplementation
    beforeEach(()=>{
      context = createEmptyContext()
      args = {}
      nodeInstance = new TaskInstance()
    })

    it('Implementace: run():void', ()=>{
      nodeImplementation = {
        run() { }
      }
      let result = executeNode({ context, nodeImplementation, nodeInstance, args })
      expect(result).toBeArrayOfSize(0)
      expect(nodeInstance.status).toBe(ActivityStatus.Completed)
    })

    it('Implementace: run():never', () => {
      nodeImplementation = {
        run() { throw new Error('TEST') }
      }
      let result = executeNode({ context, nodeImplementation, nodeInstance, args })
      expect(result).toBeArrayOfSize(0)
      expect(nodeInstance.status).toBe(ActivityStatus.Failled)
    })

    it('Implementace: prerun():void, run():void', () => {
      nodeImplementation = {
        run() { },
        prerun() { }
      }
      let result = executeNode({ context, nodeImplementation, nodeInstance, args })
      expect(result).toBeArrayOfSize(0)
      expect(nodeInstance.status).toBe(ActivityStatus.Completed)
    })

    it('Implementace: prerun():never, run():void', () => {
      nodeImplementation = {
        run() { },
        prerun() { throw new Error('test') }
      }
      let result = executeNode({ context, nodeImplementation, nodeInstance, args })
      expect(result).toBeArrayOfSize(0)
      expect(nodeInstance.status).toBe(ActivityStatus.Ready)
    })

    it('Implementace: prerun():never, run():never', () => {
      nodeImplementation = {
        run() { throw new Error('TEST') },
        prerun() { throw new Error('test')  }
      }
      let result = executeNode({ context, nodeImplementation, nodeInstance, args })
      expect(result).toBeArrayOfSize(0)
      expect(nodeInstance.status).toBe(ActivityStatus.Ready)
    })

    it('Implementace: run(initNext(1)):void', () => {
      nodeImplementation = {
        run({initNext}) { initNext([23])},
      }
      let result = executeNode({ context, nodeImplementation, nodeInstance, args })
      expect(nodeInstance.status).toBe(ActivityStatus.Completed)
      expect(result).toBeArrayOfSize(1)
      expect(result).toMatchObject([23])
    })
    it('Implementace: run(initNext(5)):void', () => {
      nodeImplementation = {
        run({ initNext }) { initNext([11,22,33,44,55]) },
      }
      let result = executeNode({ context, nodeImplementation, nodeInstance, args })
      expect(nodeInstance.status).toBe(ActivityStatus.Completed)
      expect(result).toBeArrayOfSize(5)
      expect(result).toMatchObject([11, 22, 33, 44, 55])
    })
    it('Implementace: run(initNext(2,3)):void', () => {
      nodeImplementation = {
        run({ initNext }) { initNext([11, 22]); initNext([33, 44, 55]); },
      }
      let result = executeNode({ context, nodeImplementation, nodeInstance, args })
      expect(nodeInstance.status).toBe(ActivityStatus.Completed)
      expect(result).toBeArrayOfSize(5)
      expect(result).toMatchObject([11, 22, 33, 44, 55])
    })
    it('Implementace: run(initNext(2)):never', () => {
      nodeImplementation = {
        run({ initNext }) { initNext([11, 22]); throw new Error('test') },
      }
      let result = executeNode({ context, nodeImplementation, nodeInstance, args })
      expect(nodeInstance.status).toBe(ActivityStatus.Failled)
      expect(result).toBeArrayOfSize(2)
      expect(result).toMatchObject([11, 22])
    })

    describe('Implementace: prerun(), run(), onCompleting, onFailing', () => {

      it('Vsechno OK + vsude initNext', () => {
        nodeImplementation = {
          prerun({ initNext }) { initNext([1]) },
          run({ initNext }) { initNext([2]) },
          onCompleting({ initNext }) { initNext([3]) },
          onFailing({ initNext }) { initNext([4]) }
        }
        let result = executeNode({ context, nodeImplementation, nodeInstance, args })
        expect(nodeInstance.status).toBe(ActivityStatus.Completed)
        expect(result).toBeArrayOfSize(3)
        expect(result).toMatchObject([1, 2, 3])
      })
      it('Prerun KO + vsude initNext', () => {
        nodeImplementation = {
          prerun({ initNext }) { initNext([1]); throw new Error('Eprerun') },
          run({ initNext }) { initNext([2]) },
          onCompleting({ initNext }) { initNext([3]) },
          onFailing({ initNext }) { initNext([4]) }
        }
        let result = executeNode({ context, nodeImplementation, nodeInstance, args })
        expect(nodeInstance.status).toBe(ActivityStatus.Ready)
        expect(result).toBeArrayOfSize(1)
        expect(result).toMatchObject([1])
      })
      it('Run KO + vsude initNext', () => {
        nodeImplementation = {
          prerun({ initNext }) { initNext([1]) },
          run({ initNext }) { initNext([2]); throw new Error('Erun') },
          onCompleting({ initNext }) { initNext([3]) },
          onFailing({ initNext }) { initNext([4]) }
        }
        let result = executeNode({ context, nodeImplementation, nodeInstance, args })
        expect(nodeInstance.status).toBe(ActivityStatus.Failled)
        expect(result).toBeArrayOfSize(3)
        expect(result).toMatchObject([1, 2, 4])
      })

      it('OnCompleting KO + vsude initNext', () => {
        nodeImplementation = {
          prerun({ initNext }) { initNext([1]) },
          run({ initNext }) { initNext([2]) },
          onCompleting({ initNext }) { initNext([3]); throw new Error('Ecompleting') },
          onFailing({ initNext }) { initNext([4]) }
        }
        let result = () => executeNode({ context, nodeImplementation, nodeInstance, args })
        expect(result).toThrowError()
        expect(nodeInstance.status).toBe(ActivityStatus.Completing)
      })
      it('Run KO, OnFailing KO + vsude initNext', () => {
        nodeImplementation = {
          prerun({ initNext }) { initNext([1]) },
          run({ initNext }) { initNext([2]); throw new Error('Erun') },
          onCompleting({ initNext }) { initNext([3]) },
          onFailing({ initNext }) { initNext([4]); throw new Error('Efailing') }
        }
        let result = () => executeNode({ context, nodeImplementation, nodeInstance, args })
        expect(result).toThrowError()
        expect(nodeInstance.status).toBe(ActivityStatus.Falling)
      })

    })

  })

})
