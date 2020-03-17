import 'jest-extended'

import { executeNode } from '../../src/bpmnRunner/executeHelpers'
import { IDsCollector } from '../../src/bpmnRunner/plugins'
import { NodeImplementation, ServiceImplementation } from '../../src/bpmnRunner/pluginsImplementation'
import { createEmptyContext, RunContext } from '../../src/bpmnRunner/runContext'
import { ActivityStatus, NodeElementInstance } from '../../src/entity/bpmn'

describe('Testy behove pipeline-y.', () => {

  describe('executeNode: Testy s prazndym kontextem a argumenty.', () => {
    let context: RunContext
    let nodeInstance: NodeElementInstance
    let nodeImplementation: NodeImplementation
    let services: ServiceImplementation[]
    let serviceInitNext: IDsCollector
    beforeEach(() => {
      context = createEmptyContext()
      nodeInstance = new NodeElementInstance()
      serviceInitNext = new IDsCollector({ name: 'initNext' })
      services = [serviceInitNext]
    })

    it('Implementace: run():void', () => {
      nodeImplementation = {
        run() { },
      }
      let result = executeNode({ context, nodeImplementation, nodeInstance, services })
      // expect(result.initNext).toBeArrayOfSize(0)
      expect(nodeInstance.status).toBe(ActivityStatus.Completed)
    })

    it('Implementace: run():never', () => {
      nodeImplementation = {
        run() { throw new Error('TEST') },
      }
      let result = executeNode({ context, nodeImplementation, nodeInstance, services })
      // expect(result.initNext).toBeArrayOfSize(0)
      expect(nodeInstance.status).toBe(ActivityStatus.Failled)
    })

    it('Implementace: prerun():void, run():void', () => {
      nodeImplementation = {
        run() { },
        prerun() { },
      }
      let result = executeNode({ context, nodeImplementation, nodeInstance, services })
      expect(serviceInitNext.data).toBeArrayOfSize(0)
      expect(nodeInstance.status).toBe(ActivityStatus.Completed)
    })

    it('Implementace: prerun():never, run():void', () => {
      nodeImplementation = {
        run() { },
        prerun() { throw new Error('test') },
      }
      let result = executeNode({ context, nodeImplementation, nodeInstance, services })
      expect(serviceInitNext.data).toBeArrayOfSize(0)
      expect(nodeInstance.status).toBe(ActivityStatus.Waiting)
    })

    it('Implementace: prerun():never, run():never', () => {
      nodeImplementation = {
        run() { throw new Error('TEST') },
        prerun() { throw new Error('test')  },
      }
      let result = executeNode({ context, nodeImplementation, nodeInstance, services })
      expect(serviceInitNext.data).toBeArrayOfSize(0)
      expect(nodeInstance.status).toBe(ActivityStatus.Waiting)
    })

    it('Implementace: run(initNext(1)):void', () => {
      nodeImplementation = {
        run({ fn }) { fn.initNext && fn.initNext([23])},
      }
      let result = executeNode({ context, nodeImplementation, nodeInstance, services })
      expect(nodeInstance.status).toBe(ActivityStatus.Completed)
      expect(serviceInitNext.data).toBeArrayOfSize(1)
      expect(serviceInitNext.data).toMatchObject([23])
    })
    it('Implementace: run(initNext(5)):void', () => {
      nodeImplementation = {
        run({ fn }) { fn.initNext && fn.initNext([11, 22, 33, 44, 55]) },
      }
      let result = executeNode({ context, nodeImplementation, nodeInstance, services })
      expect(nodeInstance.status).toBe(ActivityStatus.Completed)
      expect(serviceInitNext.data).toBeArrayOfSize(5)
      expect(serviceInitNext.data).toMatchObject([11, 22, 33, 44, 55])
    })
    it('Implementace: run(initNext(2,3)):void', () => {
      nodeImplementation = {
        run({ fn }) {
          fn.initNext && fn.initNext([11, 22])
          fn.initNext && fn.initNext([33, 44, 55])
        },
      }
      let result = executeNode({ context, nodeImplementation, nodeInstance, services })
      expect(nodeInstance.status).toBe(ActivityStatus.Completed)
      expect(serviceInitNext.data).toBeArrayOfSize(5)
      expect(serviceInitNext.data).toMatchObject([11, 22, 33, 44, 55])
    })
    it('Implementace: run(initNext(2)):never', () => {
      nodeImplementation = {
        run({ fn }) { fn.initNext && fn.initNext([11, 22]); throw new Error('test') },
      }
      let result = executeNode({ context, nodeImplementation, nodeInstance, services })
      expect(nodeInstance.status).toBe(ActivityStatus.Failled)
      expect(serviceInitNext.data).toBeArrayOfSize(2)
      expect(serviceInitNext.data).toMatchObject([11, 22])
    })

    describe('Implementace: prerun(), run(), onCompleting, onFailing', () => {

      it('Vsechno OK + vsude initNext', () => {
        nodeImplementation = {
          prerun({ fn }) { fn.initNext && fn.initNext([1]) },
          run({ fn }) { fn.initNext && fn.initNext(2) },
          onCompleting({ fn }) { fn.initNext && fn.initNext({id: 3}) },
          onFailing({ fn }) { fn.initNext && fn.initNext([4]) },
        }
        let result = executeNode({ context, nodeImplementation, nodeInstance, services })
        expect(nodeInstance.status).toBe(ActivityStatus.Completed)
        expect(serviceInitNext.data).toBeArrayOfSize(3)
        expect(serviceInitNext.data).toMatchObject([1, 2, 3])
      })
      it('Prerun KO + vsude initNext', () => {
        nodeImplementation = {
          prerun({ fn }) { fn.initNext && fn.initNext([1]); throw new Error('Eprerun') },
          run({ fn }) { fn.initNext && fn.initNext([2]) },
          onCompleting({ fn }) { fn.initNext && fn.initNext([3]) },
          onFailing({ fn }) { fn.initNext && fn.initNext([4]) },
        }
        let result = executeNode({ context, nodeImplementation, nodeInstance, services })
        expect(nodeInstance.status).toBe(ActivityStatus.Waiting)
        expect(serviceInitNext.data).toBeArrayOfSize(1)
        expect(serviceInitNext.data).toMatchObject([1])
      })
      it('Run KO + vsude initNext', () => {
        nodeImplementation = {
          prerun({ fn }) { fn.initNext && fn.initNext([1]) },
          run({ fn }) { fn.initNext && fn.initNext([2]); throw new Error('Erun') },
          onCompleting({ fn }) { fn.initNext && fn.initNext([3]) },
          onFailing({ fn }) { fn.initNext && fn.initNext([4]) },
        }
        let result = executeNode({ context, nodeImplementation, nodeInstance, services })
        expect(nodeInstance.status).toBe(ActivityStatus.Failled)
        expect(serviceInitNext.data).toBeArrayOfSize(3)
        expect(serviceInitNext.data).toMatchObject([1, 2, 4])
      })

      it('OnCompleting KO + vsude initNext', () => {
        nodeImplementation = {
          prerun({ fn }) { fn.initNext && fn.initNext([1]) },
          run({ fn }) { fn.initNext && fn.initNext([2]) },
          onCompleting({ fn }) { fn.initNext && fn.initNext([3]); throw new Error('Ecompleting') },
          onFailing({ fn }) { fn.initNext && fn.initNext([4]) },
        }
        let result = executeNode({ context, nodeImplementation, nodeInstance, services })
        expect(nodeInstance.status).toBe(ActivityStatus.Failled)
        expect(serviceInitNext.data).toBeArrayOfSize(4)
        expect(serviceInitNext.data).toMatchObject([1, 2, 3, 4])
      })
      it('Run KO, OnFailing KO + vsude initNext', () => {
        nodeImplementation = {
          prerun({ fn }) { fn.initNext && fn.initNext([1]) },
          run({ fn }) { fn.initNext && fn.initNext([2]); throw new Error('Erun') },
          onCompleting({ fn }) { fn.initNext && fn.initNext([3]) },
          onFailing({ fn }) { fn.initNext && fn.initNext([4]); throw new Error('Efailing') },
        }
        let result = executeNode({ context, nodeImplementation, nodeInstance, services })
        expect(nodeInstance.status).toBe(ActivityStatus.Failled)
        expect(serviceInitNext.data).toBeArrayOfSize(3)
        expect(serviceInitNext.data).toMatchObject([1, 2, 4])
      })

    })

  })


  describe('executeNode: Testy s neprazdnym kontextem', () => {
    let context: RunContext
    let nodeInstance: NodeElementInstance
    let nodeImplementation: NodeImplementation
    let services: ServiceImplementation[]
    let serviceInitNext: IDsCollector
    beforeEach(() => {
      context = createEmptyContext()
      nodeInstance = new NodeElementInstance()
      services = []
      serviceInitNext = new IDsCollector({ name: 'initNext' })
      services = [serviceInitNext]
    })

    it('Lze pristoupit k datum v kontextu.', () => {
      const outgoing = [{ id: 11, expression: 'true' }, { id: 22, expression: 'false' }]
      context.$OUTGOING = JSON.parse(JSON.stringify(outgoing))
      nodeImplementation = {
        run({context}) {
          return context
        },
      }
      let result = executeNode({ context, nodeImplementation, nodeInstance, services })
      expect(serviceInitNext.data).toBeArrayOfSize(0)
      expect(nodeInstance.status).toBe(ActivityStatus.Completed)
      expect(nodeInstance.returnValue).toMatchObject(context.$OUTPUT)
      expect(context.$OUTGOING).toMatchObject(outgoing)
    })

    it('Lze menit data v kontextu.', () => {
      context.$OUTPUT = { data: [11, 22, 33, 44] }
      nodeImplementation = {
        run({ context }) {
          let data = context.$OUTPUT.data
          if (Array.isArray(data)) {
            data.push(1234)
          }
          return context
        },
      }
      let result = executeNode({ context, nodeImplementation, nodeInstance, services })
      expect(serviceInitNext.data).toBeArrayOfSize(0)
      expect(nodeInstance.status).toBe(ActivityStatus.Completed)
      expect(nodeInstance.returnValue).toMatchObject(context.$OUTPUT)
      expect(context.$OUTPUT.data).toMatchObject([11, 22, 33, 44, 1234])
    })

    it('Kontext je stejny pro vsechy implmentacni funkce.', () => {
      let prevContext: any = context
      nodeImplementation = {
        prerun({ context }) {
          expect(context).toMatchObject(prevContext)
          prevContext = context
        },
        run({ context }) {
          expect(context).toMatchObject(prevContext)
          prevContext = context
        },
        onCompleting({ context }) {
          expect(context).toMatchObject(prevContext)
        },
      }
      let result = executeNode({ context, nodeImplementation, nodeInstance, services })
      // Pokud nesedi tak doslo k chybe v implementaci (Ready - prerun, Failed - run)
      expect(nodeInstance.status).toBe(ActivityStatus.Completed)
    })

  })

})
