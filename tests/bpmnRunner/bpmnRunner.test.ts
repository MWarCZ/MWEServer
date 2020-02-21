import 'jest-extended'

import { readFileSync } from 'fs'
import { join as joinPath } from 'path'
import { Connection } from 'typeorm'

import { BpmnBuilder } from '../../src/bpmnBuilder'
import { BpmnRunner } from '../../src/bpmnRunner'
import {
  ActivityStatus,
  NodeElementInstance,
  NodeElementTemplate,
  ProcessInstance,
  ProcessStatus,
  ProcessTemplate,
  SequenceFlowTemplate,
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
          where: { implementation: 'startEvent' },
        })
        let processInstance = await runner.initAndSaveProcess(
          { id: startEvent.processTemplateId as number },
          startEvent,
        )
        let eventInstance = await connection.getRepository(NodeElementInstance).findOneOrFail({
          processInstanceId: processInstance.id,
          templateId: startEvent.id,
        })
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
        let processInstance = await runner.initAndSaveProcess(
          { id: startEvent.processTemplateId as number },
          { id: startEvent.id as number },
        )
        let eventInstance = await connection.getRepository(NodeElementInstance).findOneOrFail({
          processInstanceId: processInstance.id,
          templateId: startEvent.id,
        })
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
          where: { implementation: 'startEvent' },
        })
        let processInstance = await runner.initAndSaveProcess(
          startEvent.processTemplate as {id:number},
          startEvent,
        )
        let eventInstance = await connection.getRepository(NodeElementInstance).findOneOrFail({
          processInstanceId: processInstance.id,
          templateId: startEvent.id,
        })
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
          if (x.implementation === 'startEvent') nodeTemplates[0] = x
          else if (x.implementation === 'task') nodeTemplates[1] = x
          else if (x.implementation === 'endEvent') nodeTemplates[2] = x
          else throw new Error('Kix')
        })
        expect(nodeTemplates).toBeArrayOfSize(3)

        let processTemplate = await connection.manager.findOneOrFail(ProcessTemplate)

        processInstance = await runner.initAndSaveProcess(
          processTemplate as { id: number },
          nodeTemplates[0],
        )
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
      describe('initNextNodes', () => {

        it('Neni vybrana zadna sequence', async() => {
          let nodesI = await runner.initNextNodes({
            processInstance,
            selectedSequenceFlows: [],
          })
          expect(nodesI).toBeArrayOfSize(0)
        })

        it('Je vybrana jedna sequence', async() => {
          let seqT = await connection.manager.find(SequenceFlowTemplate)
          expect(seqT).toBeArrayOfSize(2)
          if (seqT.length < 2) throw new Error('xxx')

          let nodesI = await runner.initNextNodes({
            processInstance,
            selectedSequenceFlows: [seqT[0]],
          })
          expect(nodesI).toBeArrayOfSize(1)
          nodesI.forEach(node => {
            expect(node).toBeInstanceOf(NodeElementInstance)
            expect(node.template && node.template.implementation).toBe('task')
          })
        })

        it('Je vybrano vice sequenci', async() => {
          let seqT = await connection.manager.find(SequenceFlowTemplate)
          expect(seqT).toBeArrayOfSize(2)
          if (seqT.length < 2) throw new Error('xxx')

          let nodesI = await runner.initNextNodes({
            processInstance,
            selectedSequenceFlows: [...seqT],
          })
          expect(nodesI).toBeArrayOfSize(seqT.length)
          nodesI.forEach((node, index) => {
            expect(node).toBeInstanceOf(NodeElementInstance)
            expect(node.template && node.template.implementation).toBe(['task', 'endEvent'][index])
          })
        })

      })
      describe('initNext', () => {
        it('', async() => {

        })
      })

      it('Cyklus nekolika runNodeElement', async() => {

        for (let i = 0; i < 2; i++) {
          let nodeI = await connection.manager.findOneOrFail(NodeElementInstance, {
            status: ActivityStatus.Ready,
          })
          await runner.runNode({
            instance: nodeI,
            args: {},
          })
        }
      })


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
      where: { implementation: 'startEvent' },
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
    let aaa = await runner.runNode({
      instance: startI,
      args: {},
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