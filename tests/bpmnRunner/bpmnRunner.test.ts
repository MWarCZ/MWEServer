import 'jest-extended'

import { readFileSync } from 'fs'
import { join as joinPath } from 'path'
import { Connection } from 'typeorm'

import { BpmnBuilder } from '../../src/bpmnBuilder'
import { BpmnRunner, SupportedNode } from '../../src/bpmnRunner'
import {
  ActivityStatus,
  DataObjectInstance,
  NodeElementInstance,
  NodeElementTemplate,
  ProcessInstance,
  ProcessStatus,
  ProcessTemplate,
} from '../../src/entity/bpmn'
import { cleanDataInTables, closeConn, createConn } from '../../src/utils/db'

let connection: Connection
let builder: BpmnBuilder
let runner: BpmnRunner

describe('Testy s bpmnRunner', () => {

  beforeEach(async() => {
    connection = await createConn()
    await cleanDataInTables(connection, connection.entityMetadatas)
    builder = new BpmnBuilder(connection)
    runner = new BpmnRunner(connection)
  })
  afterEach(async() => {
    await closeConn(connection)
  })

  describe('Zakladni jednoduche testovani funkcnosti funkci', () => {
    beforeEach(async() => {
      let xml = readFileSync(joinPath(
        __dirname,
        '../resources/bpmn/simple.bpmn',
      ), 'utf8').toString()
      await builder.loadFromXml(xml)
    })

    describe('initAndSaveProcess', () => {

      it('initAndSaveProcess v1', async() => {
        let startEvent = await connection.manager.findOneOrFail(NodeElementTemplate, {
          relations: ['outgoing'],
          where: { implementation: SupportedNode.StartEvent },
        })
        let { process: processInstance, node: eventInstance} = await runner.initAndSaveProcess(
          { id: startEvent.processTemplateId as number },
          startEvent,
        )
        // let eventInstanceInDb = await connection.getRepository(NodeElementInstance).findOneOrFail({
        //   processInstanceId: processInstance.id,
        //   templateId: startEvent.id,
        // })
        expect(processInstance).toBeInstanceOf(ProcessInstance)
        expect(processInstance.id).toBeNumber()
        expect(processInstance.processTemplateId).toBe(startEvent.processTemplateId)
        expect(processInstance.status).toBe(ProcessStatus.Ready)
        expect(eventInstance).toBeInstanceOf(NodeElementInstance)
        expect(eventInstance.id).toBeNumber()
        expect(eventInstance.processInstanceId).toBe(processInstance.id)
        expect(eventInstance.status).toBe(ActivityStatus.Ready)
      })

      it('initAndSaveProcess v2', async() => {
        let startEvent = await connection.manager.findOneOrFail(NodeElementTemplate, {
          relations: ['outgoing'],
          where: { implementation: 'startEvent' },
        })
        let { process: processInstance, node: eventInstance } = await runner.initAndSaveProcess(
          { id: startEvent.processTemplateId as number },
          { id: startEvent.id as number },
        )
        // let eventInstanceInDb = await connection.getRepository(NodeElementInstance).findOneOrFail({
        //   processInstanceId: processInstance.id,
        //   templateId: startEvent.id,
        // })
        expect(processInstance).toBeInstanceOf(ProcessInstance)
        expect(processInstance.id).toBeNumber()
        expect(processInstance.processTemplateId).toBe(startEvent.processTemplateId)
        expect(processInstance.status).toBe(ProcessStatus.Ready)
        expect(eventInstance).toBeInstanceOf(NodeElementInstance)
        expect(eventInstance.id).toBeNumber()
        expect(eventInstance.processInstanceId).toBe(processInstance.id)
        expect(eventInstance.status).toBe(ActivityStatus.Ready)
      })

      it('initAndSaveProcess v3', async() => {
        let startEvent = await connection.manager.findOneOrFail(NodeElementTemplate, {
          relations: ['outgoing', 'processTemplate'],
          where: { implementation: SupportedNode.StartEvent },
        })
        let { process: processInstance, node: eventInstance } = await runner.initAndSaveProcess(
          startEvent.processTemplate as {id:number},
          startEvent,
        )
        // let eventInstanceInDb = await connection.getRepository(NodeElementInstance).findOneOrFail({
        //   processInstanceId: processInstance.id,
        //   templateId: startEvent.id,
        // })
        expect(processInstance).toBeInstanceOf(ProcessInstance)
        expect(processInstance.id).toBeNumber()
        expect(processInstance.processTemplateId).toBe(startEvent.processTemplateId)
        expect(processInstance.status).toBe(ProcessStatus.Ready)
        expect(eventInstance).toBeInstanceOf(NodeElementInstance)
        expect(eventInstance.id).toBeNumber()
        expect(eventInstance.processInstanceId).toBe(processInstance.id)
        expect(eventInstance.status).toBe(ActivityStatus.Ready)
      })

    })

    describe('initXXX', () => {
      let processInstance: ProcessInstance
      let nodeTemplates: NodeElementTemplate[]

      beforeEach(async() => {
        nodeTemplates = []
        let xxx = await connection.manager.find(NodeElementTemplate)
        xxx.forEach(x => {
          if (x.implementation === SupportedNode.StartEvent) nodeTemplates[0] = x
          else if (x.implementation === SupportedNode.Task) nodeTemplates[1] = x
          else if (x.implementation === SupportedNode.EndEvent) nodeTemplates[2] = x
          else throw new Error('Kix')
        })
        expect(nodeTemplates).toBeArrayOfSize(3)

        let processTemplate = await connection.manager.findOneOrFail(ProcessTemplate)

        let result = await runner.initAndSaveProcess(
          processTemplate as { id: number },
          nodeTemplates[0],
        )
        processInstance = result.process
      })

      describe('initNodeElement', () => {

        it('Vlozeni zadneho elementu', async() => {
          let xxx = await runner.initNodeElement(processInstance, [])
          expect(xxx).toBeArrayOfSize(0)
        })
        it('Vlozeni jednoho elementu', async() => {
          let startI = await runner.initNodeElement(processInstance, [nodeTemplates[0]])
          expect(startI).toBeArrayOfSize(1)
          expect(startI[0]).toBeInstanceOf(NodeElementInstance)

          let taskI = await runner.initNodeElement(processInstance, [nodeTemplates[1]])
          expect(taskI).toBeArrayOfSize(1)
          expect(taskI[0]).toBeInstanceOf(NodeElementInstance)

          let endI = await runner.initNodeElement(processInstance, [nodeTemplates[2]])
          expect(endI).toBeArrayOfSize(1)
          expect(endI[0]).toBeInstanceOf(NodeElementInstance)
        })
        it('Vlozeni vice elementu', async() => {
          let nodesI = await runner.initNodeElement(processInstance, [...nodeTemplates])
          expect(nodesI).toBeArrayOfSize(nodeTemplates.length)
          nodesI.forEach(nodeI => {
            expect(nodeI).toBeInstanceOf(NodeElementInstance)
            expect(nodeI.status).toBe(ActivityStatus.Ready)
          })
        })
        it('Vytvor pokud neexistuji (Neexistuje zadny)', async() => {
          await connection.manager.delete(NodeElementInstance, {
            processInstanceId: processInstance.id,
          })

          let nodesI = await runner.initNodeElement(processInstance, [...nodeTemplates], true)
          expect(nodesI).toBeArrayOfSize(nodeTemplates.length)
          nodesI.forEach(nodeI => {
            expect(nodeI).toBeInstanceOf(NodeElementInstance)
            expect(nodeI.status).toBe(ActivityStatus.Ready)
          })
        })
        it('Vytvor pokud neexistuji (Existuje jeden - startevent)', async() => {
          let nodesI = await runner.initNodeElement(processInstance, [...nodeTemplates], true)
          expect(nodesI).toBeArrayOfSize(2)
          nodesI.forEach(nodeI => {
            expect(nodeI).toBeInstanceOf(NodeElementInstance)
            expect(nodeI.status).toBe(ActivityStatus.Ready)
          })
        })
      })

      it('Cyklus nekolika runIt', async() => {

        for (let i = 0; i < 3; i++) {
          // console.log('==========', i, '=========')
          let nodeI = await connection.manager.findOneOrFail(NodeElementInstance, {
            status: ActivityStatus.Ready,
          })
          // console.warn(nodeI)
          await runner.runIt({
            instance: nodeI,
          })
          // console.log('--------', i, '----------')
        }
      })


    })

  })
  describe('Ocekavany beh procesu.', () => {
    it('simple.bpmn', async() => {
      let xml = readFileSync(joinPath(
        __dirname,
        '../resources/bpmn/simple.bpmn',
      ), 'utf8').toString()
      await builder.loadFromXml(xml)

      let processTemplate = await connection.manager.findOneOrFail(ProcessTemplate, {
        relations: ['nodeElements'],
      })
      let nodeElements = processTemplate.nodeElements as NodeElementTemplate[]
      let startNode = nodeElements.find(n => `${n.implementation}`.includes(SupportedNode.StartEvent)) as NodeElementTemplate
      let processInstance = await runner.initAndSaveProcess(
        processTemplate as { id: number },
        startNode,
      )

      let expected = [
        { nodeInstances: 1, completedNodes: 0, readyNodes: 1, processStatus: ProcessStatus.Ready },
        { nodeInstances: 2, completedNodes: 1, readyNodes: 1, processStatus: ProcessStatus.Active },
        { nodeInstances: 3, completedNodes: 2, readyNodes: 1, processStatus: ProcessStatus.Active },
        { nodeInstances: 3, completedNodes: 3, readyNodes: 0, processStatus: ProcessStatus.Completed },
      ]
      for (let exp of expected ) {
        let processI = await connection.manager.findOneOrFail(ProcessInstance)
        let nodeInstances = await connection.manager.find(NodeElementInstance )
        let completedNodes = nodeInstances.filter(n => n.status === ActivityStatus.Completed)
        let readyNodes = nodeInstances.filter(n => n.status === ActivityStatus.Ready)

        expect(nodeInstances).toBeArrayOfSize(exp.nodeInstances)
        expect(completedNodes).toBeArrayOfSize(exp.completedNodes)
        expect(readyNodes).toBeArrayOfSize(exp.readyNodes)
        expect(processI.status).toBe(exp.processStatus)

        let readyNode = readyNodes.pop()
        if (readyNode) {
          await runner.runIt({
            instance: readyNode,
          })
        }

      }

    })

    it.each([
      [
        '../resources/bpmn/simple/simple_or_outgoing.bpmn',
        'fifo',
        [
          { nodeInstances: 1, completedNodes: 0, readyNodes: 1, processStatus: ProcessStatus.Ready },
          { nodeInstances: 2, completedNodes: 1, readyNodes: 1, processStatus: ProcessStatus.Active },
          { nodeInstances: 4, completedNodes: 2, readyNodes: 2, processStatus: ProcessStatus.Active },
          { nodeInstances: 4, completedNodes: 3, readyNodes: 1, processStatus: ProcessStatus.Active },
          { nodeInstances: 4, completedNodes: 4, readyNodes: 0, processStatus: ProcessStatus.Completed },
        ],
      ],
      [
        '../resources/bpmn/simple/simple_and_outgoing.bpmn',
        'fifo',
        [
          { nodeInstances: 1, completedNodes: 0, readyNodes: 1, processStatus: ProcessStatus.Ready },
          { nodeInstances: 2, completedNodes: 1, readyNodes: 1, processStatus: ProcessStatus.Active },
          { nodeInstances: 4, completedNodes: 2, readyNodes: 2, processStatus: ProcessStatus.Active },
          { nodeInstances: 4, completedNodes: 3, readyNodes: 1, processStatus: ProcessStatus.Active },
          { nodeInstances: 4, completedNodes: 4, readyNodes: 0, processStatus: ProcessStatus.Completed },
        ],
      ],
      [
        '../resources/bpmn/simple/simple_xor_outgoing.bpmn',
        'fifo',
        [
          { nodeInstances: 1, completedNodes: 0, readyNodes: 1, processStatus: ProcessStatus.Ready },
          { nodeInstances: 2, completedNodes: 1, readyNodes: 1, processStatus: ProcessStatus.Active },
          { nodeInstances: 3, completedNodes: 2, readyNodes: 1, processStatus: ProcessStatus.Active },
          { nodeInstances: 3, completedNodes: 3, readyNodes: 0, processStatus: ProcessStatus.Completed },
        ],
      ],
      [
        '../resources/bpmn/simple/simple_scripttask.bpmn',
        'fifo',
        [
          { nodeInstances: 1, completedNodes: 0, readyNodes: 1, processStatus: ProcessStatus.Ready },
          { nodeInstances: 2, completedNodes: 1, readyNodes: 1, processStatus: ProcessStatus.Active },
          { nodeInstances: 3, completedNodes: 2, readyNodes: 1, processStatus: ProcessStatus.Active },
          { nodeInstances: 3, completedNodes: 3, readyNodes: 0, processStatus: ProcessStatus.Completed },
        ],
      ],
      [
        '../resources/bpmn/simple/simple_and_incoming.bpmn',
        'fifo',
        [
          { nodeInstances: 1, completedNodes: 0, readyNodes: 1, processStatus: ProcessStatus.Ready },
          { nodeInstances: 2, completedNodes: 1, readyNodes: 1, processStatus: ProcessStatus.Active },
          { nodeInstances: 4, completedNodes: 2, readyNodes: 2, processStatus: ProcessStatus.Active },
          { nodeInstances: 5, completedNodes: 3, readyNodes: 2, processStatus: ProcessStatus.Active },
          { nodeInstances: 5, completedNodes: 4, readyNodes: 1, processStatus: ProcessStatus.Active },
          { nodeInstances: 6, completedNodes: 5, readyNodes: 1, processStatus: ProcessStatus.Active },
          { nodeInstances: 6, completedNodes: 6, readyNodes: 0, processStatus: ProcessStatus.Completed },
        ],
      ],
      [
        '../resources/bpmn/simple/simple_and_incoming.bpmn',
        'lifo',
        [
          { nodeInstances: 1, completedNodes: 0, readyNodes: 1, processStatus: ProcessStatus.Ready },
          { nodeInstances: 2, completedNodes: 1, readyNodes: 1, processStatus: ProcessStatus.Active },
          { nodeInstances: 4, completedNodes: 2, readyNodes: 2, processStatus: ProcessStatus.Active },
          { nodeInstances: 5, completedNodes: 3, readyNodes: 2, processStatus: ProcessStatus.Active },
          { nodeInstances: 5, completedNodes: 3, readyNodes: 1, processStatus: ProcessStatus.Active },
          { nodeInstances: 5, completedNodes: 4, readyNodes: 1, processStatus: ProcessStatus.Active },
          { nodeInstances: 6, completedNodes: 5, readyNodes: 1, processStatus: ProcessStatus.Active },
          { nodeInstances: 6, completedNodes: 6, readyNodes: 0, processStatus: ProcessStatus.Completed },
        ],
      ],
      [
        '../resources/bpmn/simple/simple_and_incoming_nested.bpmn',
        'fifo',
        [
          { nodeInstances: 1, completedNodes: 0, readyNodes: 1, processStatus: ProcessStatus.Ready },
          { nodeInstances: 2, completedNodes: 1, readyNodes: 1, processStatus: ProcessStatus.Active },
          { nodeInstances: 5, completedNodes: 2, readyNodes: 3, processStatus: ProcessStatus.Active },
          { nodeInstances: 6, completedNodes: 3, readyNodes: 3, processStatus: ProcessStatus.Active },
          { nodeInstances: 7, completedNodes: 4, readyNodes: 3, processStatus: ProcessStatus.Active },
          { nodeInstances: 7, completedNodes: 5, readyNodes: 2, processStatus: ProcessStatus.Active },
          { nodeInstances: 7, completedNodes: 5, readyNodes: 1, processStatus: ProcessStatus.Active },
          { nodeInstances: 7, completedNodes: 6, readyNodes: 1, processStatus: ProcessStatus.Active },
          { nodeInstances: 8, completedNodes: 7, readyNodes: 1, processStatus: ProcessStatus.Active },
          { nodeInstances: 8, completedNodes: 8, readyNodes: 0, processStatus: ProcessStatus.Completed },
        ],
      ],
      [
        '../resources/bpmn/simple/simple_and_incoming_nested.bpmn',
        'lifo',
        [
          { nodeInstances: 1, completedNodes: 0, readyNodes: 1, processStatus: ProcessStatus.Ready },
          { nodeInstances: 2, completedNodes: 1, readyNodes: 1, processStatus: ProcessStatus.Active },
          { nodeInstances: 5, completedNodes: 2, readyNodes: 3, processStatus: ProcessStatus.Active },
          { nodeInstances: 6, completedNodes: 3, readyNodes: 3, processStatus: ProcessStatus.Active },
          { nodeInstances: 6, completedNodes: 3, readyNodes: 2, processStatus: ProcessStatus.Active },
          { nodeInstances: 6, completedNodes: 4, readyNodes: 2, processStatus: ProcessStatus.Active },
          { nodeInstances: 7, completedNodes: 5, readyNodes: 2, processStatus: ProcessStatus.Active },
          { nodeInstances: 7, completedNodes: 5, readyNodes: 1, processStatus: ProcessStatus.Active },
          { nodeInstances: 7, completedNodes: 6, readyNodes: 1, processStatus: ProcessStatus.Active },
          { nodeInstances: 8, completedNodes: 7, readyNodes: 1, processStatus: ProcessStatus.Active },
          { nodeInstances: 8, completedNodes: 8, readyNodes: 0, processStatus: ProcessStatus.Completed },
        ],
      ],
      [
        '../resources/bpmn/simple/simple_without_end.bpmn',
        'fifo',
        [
          { nodeInstances: 1, completedNodes: 0, readyNodes: 1, processStatus: ProcessStatus.Ready },
          { nodeInstances: 2, completedNodes: 1, readyNodes: 1, processStatus: ProcessStatus.Active },
          { nodeInstances: 2, completedNodes: 2, readyNodes: 0, processStatus: ProcessStatus.Failled },
        ],
      ],

      [
        '../resources/bpmn/simple/link_event.bpmn',
        'fifo',
        [
          { nodeInstances: 1, completedNodes: 0, readyNodes: 1, processStatus: ProcessStatus.Ready },
          { nodeInstances: 2, completedNodes: 1, readyNodes: 1, processStatus: ProcessStatus.Active },
          { nodeInstances: 4, completedNodes: 2, readyNodes: 2, processStatus: ProcessStatus.Active },
          { nodeInstances: 5, completedNodes: 3, readyNodes: 2, processStatus: ProcessStatus.Active },
          { nodeInstances: 6, completedNodes: 4, readyNodes: 2, processStatus: ProcessStatus.Active },
          { nodeInstances: 6, completedNodes: 5, readyNodes: 1, processStatus: ProcessStatus.Active },
          { nodeInstances: 6, completedNodes: 6, readyNodes: 0, processStatus: ProcessStatus.Completed },
        ],
      ],

    ])('%s - %s', async(path, orderExucute, expected ) => {
      let xml = readFileSync(joinPath(
        __dirname,
        path,
      ), 'utf8').toString()
      await builder.loadFromXml(xml)

      let processTemplate = await connection.manager.findOneOrFail(ProcessTemplate, {
        relations: ['nodeElements'],
      })
      let nodeElements = processTemplate.nodeElements as NodeElementTemplate[]
      let startNode = nodeElements.find(n => `${n.implementation}`.includes(SupportedNode.StartEvent)) as NodeElementTemplate
      let processInstance = await runner.initAndSaveProcess(
        processTemplate as { id: number },
        startNode,
      )

      for (let exp of expected) {
        let processI = await connection.manager.findOneOrFail(ProcessInstance)
        let nodeInstances = await connection.manager.find(NodeElementInstance)
        let completedNodes = nodeInstances.filter(n => n.status === ActivityStatus.Completed)
        let readyNodes = nodeInstances.filter(n => n.status === ActivityStatus.Ready)
        let waitNodes = nodeInstances.filter(n => n.status === ActivityStatus.Waiting)

        // if (path.includes('link_event')) {
          // console.warn(JSON.stringify(nodeInstances, null, 2))
          // console.error(JSON.stringify(processI, null, 2))
        // }

        if (exp.nodeInstances)
          expect(nodeInstances).toBeArrayOfSize(exp.nodeInstances)
        if (exp.completedNodes) {
          expect(completedNodes).toBeArrayOfSize(exp.completedNodes)
          for (let node of completedNodes) {
            expect(node.endDateTime).toBeDate()
          }
        }
        if (exp.readyNodes) {
          expect(readyNodes).toBeArrayOfSize(exp.readyNodes)
          for (let node of readyNodes) {
            expect(node.endDateTime).toBeNull()
          }
        }
        if (exp.processStatus) {
          expect(processI.status).toBe(exp.processStatus)
          if ([
            ProcessStatus.Completed,
            ProcessStatus.Failled,
            ProcessStatus.Terminated,
          ].includes(processI.status)) {
            expect(processI.endDateTime).toBeDate()
          } else {
            expect(processI.endDateTime).toBeNull()
          }
        }

        let readyNode: NodeElementInstance | undefined
        if (orderExucute === 'fifo') {
          readyNode = readyNodes.shift()
        }
        else if (orderExucute === 'lifo') {
          readyNode = readyNodes.pop()
        }

        if (readyNode) {
          await runner.runIt({
            instance: readyNode,
          })
        }

      }

    })

    it.each([
      [
        '../resources/bpmn/simple/simple_scripttask.bpmn',
        [
          { nodeInstances: 1, processStatus: ProcessStatus.Ready },
          { nodeInstances: 2, processStatus: ProcessStatus.Active, retVal: {
            xxx: { name: 'SkriptX' },
          } },
          { nodeInstances: 3, processStatus: ProcessStatus.Active },
          { nodeInstances: 3, processStatus: ProcessStatus.Completed },
        ],
      ],
      [
        '../resources/bpmn/simple/simple_scripttask_inputdata.bpmn',
        [
          { nodeInstances: 1, processStatus: ProcessStatus.Ready },
          { nodeInstances: 2, processStatus: ProcessStatus.Active, retVal: {
              xxx: {
                name: 'SkriptX',
                input: { Aaa: {pozdrav: 'ahoj', cislo: 10, existuji: true} },
                number: 10,
                greeting: 'ahoj',
              },
            },
          },
          { nodeInstances: 3, processStatus: ProcessStatus.Active },
          { nodeInstances: 3, processStatus: ProcessStatus.Completed },
        ],
      ],
      [
        '../resources/bpmn/simple/simple_scripttask_outputdata.bpmn',
        [
          {
            nodeInstances: 1, processStatus: ProcessStatus.Ready,
          },
          {
            nodeInstances: 2, processStatus: ProcessStatus.Active, retVal: {
              xxx: {
                name: 'SkriptX',
                input: {},
              },
              Bbb: { a: 1, b: 'B', c: [true, false, false] },
            },
          },
          {
            nodeInstances: 3, processStatus: ProcessStatus.Active, dataObjB: {
              a: 1, b: 'B', c: [true, false, false],
            },
          },
          {
            nodeInstances: 3, processStatus: ProcessStatus.Completed, dataObjB: {
              a: 1, b: 'B', c: [true, false, false],
            },
          },
        ],
      ],
      [
        '../resources/bpmn/simple/simple_scripttask_inputdata_outputdata.bpmn',
        [
          { nodeInstances: 1, processStatus: ProcessStatus.Ready },
          {
            nodeInstances: 2, processStatus: ProcessStatus.Active, retVal: {
              xxx: {
                name: 'SkriptX',
                input: { Aaa: { pozdrav: 'ahoj', cislo: 10, existuji: true } },
                outputBbb: { pozdrav: 'caw', cislo: 22, existuji: false },
              },
              Bbb: { a: 1, b: 'B', c: [true, false, false] },
            },
          },
          { nodeInstances: 3, processStatus: ProcessStatus.Active, dataObjB: {
              a: 1, b: 'B', c: [true, false, false],
            },
          },
          { nodeInstances: 3, processStatus: ProcessStatus.Completed, dataObjB: {
              a: 1, b: 'B', c: [true, false, false],
            },
          },
        ],
      ],
    ])('DataFlow: %s', async(path, expected) => {
      let xml = readFileSync(joinPath(
        __dirname,
        path,
      ), 'utf8').toString()
      await builder.loadFromXml(xml)

      let processTemplate = await connection.manager.findOneOrFail(ProcessTemplate, {
        relations: ['nodeElements', 'dataObjects'],
      })
      let nodeElements = processTemplate.nodeElements as NodeElementTemplate[]
      let startNode = nodeElements.find(n => `${n.implementation}`.includes(SupportedNode.StartEvent)) as NodeElementTemplate
      let processInstance = await runner.initAndSaveProcess(
        processTemplate as { id: number },
        startNode,
      )

      for (let exp of expected) {
        let processI = await connection.manager.findOneOrFail(ProcessInstance, {
          relations: ['dataObjects'],
        })
        let nodeInstances = await connection.manager.find(NodeElementInstance)
        let readyNodes = nodeInstances.filter(n => n.status === ActivityStatus.Ready)
        let dataObjB = await connection.manager.findOne(DataObjectInstance)

        // console.warn(JSON.stringify(processTemplate.dataObjects, null, 2))
        // console.error(JSON.stringify(processI.dataObjects, null, 2))

        if (exp.nodeInstances)
          expect(nodeInstances).toBeArrayOfSize(exp.nodeInstances)
        if (exp.processStatus)
          expect(processI.status).toBe(exp.processStatus)
        if ((exp as { dataObjB: any }).dataObjB) {
          expect(dataObjB && dataObjB.data).toStrictEqual((exp as { dataObjB: any }).dataObjB)
        }

        let readyNode: NodeElementInstance | undefined
        readyNode = readyNodes.shift()

        if (readyNode) {
          await runner.runIt({
            instance: readyNode,
          })
          let executedInstance = await connection.manager.findOneOrFail(NodeElementInstance, {
            id: readyNode.id,
          })
          if (exp.retVal)
            expect(executedInstance.returnValue).toStrictEqual(exp.retVal)

        }

      }

    })

  })


  it.skip('xxx', async() => {

    let xml = readFileSync(joinPath(
      __dirname,
      '../resources/bpmn/simple.bpmn',
    ), 'utf8').toString()

    await builder.loadFromXml(xml)

    let startEvent = await connection.manager.findOneOrFail(NodeElementTemplate, {
      relations: ['outgoing'],
      where: { implementation: SupportedNode.StartEvent },
    })
    let processI = await runner.initAndSaveProcess(
      { id: startEvent.processTemplateId as number },
      startEvent,
    )
    if (startEvent.outgoing) {
      // let seqI = await runner.initSequenceFlow(processI, startEvent.outgoing, true)
      // console.log(seqI)
      // let seqI = await runner.initNext({
      //   processInstance: processI,
      //   // selectedSequenceFlows: [],
      //   // possibleSequenceFlows: [],
      //   selectedSequenceFlows: [...startEvent.outgoing],
      //   possibleSequenceFlows: [...startEvent.outgoing],
      // })

    }

    // ==========
    let startI = await connection.manager.findOneOrFail(NodeElementInstance)
    console.log('xxxx')
    let aaa = await runner.runIt({
      instance: startI,
    })

    // let startEventI = await connection.manager.findOneOrFail(StartEventInstance)
    // await runner.runIt(startEventI)

    // let task = await connection.manager.findOneOrFail(TaskTemplate)
    // let taskI = await runner.initTask(processI, [task] )
    // taskI = await runner.saveElement(taskI)

    // await runner.runIt(taskI[0])

    // console.log(taskI)
    // console.log(startEventI)

  })


})
