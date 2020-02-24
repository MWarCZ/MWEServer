import 'jest-extended'

import { readFileSync } from 'fs'
import { join as joinPath } from 'path'
import { Connection } from 'typeorm'

import { BpmnBuilder } from '../../src/bpmnBuilder'
import {
  DataObjectTemplate,
  NodeElementTemplate,
  ProcessTemplate,
  ProcessType,
  SequenceFlowTemplate,
} from '../../src/entity/bpmn'
import { cleanDataInTables, closeConn, createConn } from '../../src/utils/db'

let connection: Connection

describe('Testy prevodu XML na interni entity DB', () => {
  beforeEach(async() => {
    connection = await createConn()
    await cleanDataInTables(connection, connection.entityMetadatas)
  })
  afterEach(async() => {
    await closeConn(connection)
  })

  it('Jednoduchy diagram', async() => {
    const test = {
      process: {
        id: 'ID_PROC_1',
        isExecutable: false,
        versionType: 'number',
        version: '1',
      },
      startEvent: {
        id: 'ID_SE_1',
        outgoing: 'ID_SF_1',
      },
      endEvent: {
        id: 'ID_EE_1',
        incoming: 'ID_SF_2',
      },
      task: {
        id: 'ID_TASK_1',
        incoming: 'ID_SF_1',
        outgoing: 'ID_SF_2',
      },
      sequences: [
        {
          id: 'ID_SF_1',
          target: 'ID_TASK_1',
          source: 'ID_SE_1',
        },
        {
          id: 'ID_SF_2',
          target: 'ID_EE_1',
          source: 'ID_TASK_1',
        },
      ],
    }
    const builder = new BpmnBuilder(connection)
    await builder.loadFromXml(`<?xml version="1.0" encoding="UTF-8"?>
      <bpmn:definitions
        xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL"
        xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI"
        xmlns:dc="http://www.omg.org/spec/DD/20100524/DC"
        xmlns:di="http://www.omg.org/spec/DD/20100524/DI"
        xmlns:mwe="http://www.mwarcz.cz/mwe/bpmn/"
        id="Definitions_0zzkwuq"
        targetNamespace="http://bpmn.io/schema/bpmn"
        exporter="bpmn-js (https://demo.bpmn.io)"
        exporterVersion="6.2.0">

        <bpmn:process id="${test.process.id}" isExecutable="${test.process.isExecutable}" mwe:versionType="${test.process.versionType}" mwe:version="${test.process.version}">

          <bpmn:startEvent id="${test.startEvent.id}">
            <bpmn:outgoing>${test.startEvent.outgoing}</bpmn:outgoing>
          </bpmn:startEvent>

          <bpmn:task id="${test.task.id}">
            <bpmn:incoming>${test.task.incoming}</bpmn:incoming>
            <bpmn:outgoing>${test.task.outgoing}</bpmn:outgoing>
            <bpmn:dataInputAssociation id="DataInputAssociation_1">
              <bpmn:sourceRef>DataObjectReference_1</bpmn:sourceRef>
            </bpmn:dataInputAssociation>
            <bpmn:dataOutputAssociation id="DataOutputAssociation_1">
              <bpmn:targetRef>DataObjectReference_1</bpmn:targetRef>
            </bpmn:dataOutputAssociation>
          </bpmn:task>

          <bpmn:dataObjectReference id="DataObjectReference_1" dataObjectRef="DataObject_1" />
          <bpmn:dataObject name='DATA' id="DataObject_1">
            <bpmn:extensionElements>
            <mwe:json>
            {"pozdrav":"ahoj", "cislo": 10, "existuji": true}
            </mwe:json>
            </bpmn:extensionElements>
          </bpmn:dataObject>

          <bpmn:sequenceFlow id="${test.sequences[0].id}" sourceRef="${test.sequences[0].source}" targetRef="${test.sequences[0].target}" />
          <bpmn:sequenceFlow id="${test.sequences[1].id}" sourceRef="${test.sequences[1].source}" targetRef="${test.sequences[1].target}" />

          <bpmn:endEvent id="${test.endEvent.id}">
            <bpmn:incoming>${test.endEvent.incoming}</bpmn:incoming>
          </bpmn:endEvent>

        </bpmn:process>

        <bpmndi:BPMNDiagram id="BPMNDiagram_1">
        </bpmndi:BPMNDiagram>
      </bpmn:definitions>
    `)
    const process = await connection.getRepository(ProcessTemplate).findOneOrFail()
    expect(process.isExecutable).toBe(test.process.isExecutable)
    expect(process.versionType).toBe(test.process.versionType)
    expect(process.version).toBe(test.process.version)

    expect(process.processType).toBe(ProcessType.None)

    const startEvent = await connection.getRepository(NodeElementTemplate).findOneOrFail({
      relations: ['outgoing'],
      where: {
        implementation: 'startEvent',
      },
    })
    expect(startEvent.outgoing).toBeArrayOfSize(1)
    expect(startEvent.processTemplateId).toBe(process.id)

    const endEvent = await connection.getRepository(NodeElementTemplate).findOneOrFail({
      relations: ['incoming'],
      where: {
        implementation: 'endEvent',
      },
    })
    expect(endEvent.incoming).toBeArrayOfSize(1)
    expect(endEvent.processTemplateId).toBe(process.id)

    const dataObject = await connection.getRepository(DataObjectTemplate).findOneOrFail()
    expect(dataObject.name).toBe('DATA')
    expect(dataObject.strict).toBeFalsy()
    expect(dataObject.json).toStrictEqual({ "pozdrav": "ahoj", "cislo": 10, "existuji": true })
    expect(dataObject.processTemplateId).toBe(process.id)

    const task = await connection.getRepository(NodeElementTemplate).findOneOrFail({
      relations: ['incoming', 'outgoing', 'inputs', 'outputs'],
      where: {
        implementation: 'task',
      },
    })
    expect(task.incoming).toBeArrayOfSize(1)
    expect(task.outgoing).toBeArrayOfSize(1)
    expect(task.inputs).toBeArrayOfSize(1)
    expect(task.outputs).toBeArrayOfSize(1)
    expect(task.processTemplateId).toBe(process.id)

    const sequences = await connection.getRepository(SequenceFlowTemplate).find({
      relations: ['source', 'target'],
    })
    expect(sequences).toBeArrayOfSize(2)
    sequences.forEach(sequence => {
      expect(sequence.source).toBeDefined()
      expect(sequence.target).toBeDefined()
      expect(sequence.processTemplateId).toBe(process.id)
    })

  })

  describe('Testy nacteni diagramu bpmn ze souboru.', () => {

    it('Diagram simple.bpmn', async() => {
      let xml = readFileSync(joinPath(
        __dirname,
        '../resources/bpmn/simple.bpmn',
      ), 'utf8').toString()

      let builder = new BpmnBuilder(connection)
      await builder.loadFromXml(xml)

      const process = await connection.getRepository(ProcessTemplate).findOneOrFail()

      const startEvent = await connection.getRepository(NodeElementTemplate).findOneOrFail({
        relations: ['outgoing'],
        where: {
          implementation: 'startEvent',
        },
      })
      expect(startEvent.outgoing).toBeArrayOfSize(1)

      const endEvent = await connection.getRepository(NodeElementTemplate).findOneOrFail({
        relations: ['incoming'],
        where: {
          implementation: 'endEvent',
        },
      })
      expect(endEvent.incoming).toBeArrayOfSize(1)

      const task = await connection.getRepository(NodeElementTemplate).findOneOrFail({
        relations: ['incoming', 'outgoing'],
        where: {
          implementation: 'task',
        },
      })
      expect(task.incoming).toBeArrayOfSize(1)
      expect(task.outgoing).toBeArrayOfSize(1)

      const sequences = await connection.getRepository(SequenceFlowTemplate).find({
        relations: ['source', 'target'],
      })
      expect(sequences).toBeArrayOfSize(2)
      sequences.forEach(sequence => {
        expect(sequence.source).toBeDefined()
        expect(sequence.target).toBeDefined()
      })
    })

    it('Diagram simple2.bpmn', async() => {
      let xml = readFileSync(joinPath(
        __dirname,
        '../resources/bpmn/simple2.bpmn',
      ), 'utf8').toString()

      let builder = new BpmnBuilder(connection)
      await builder.loadFromXml(xml)

      const process = await connection.getRepository(ProcessTemplate).findOneOrFail()

      const startEvent = await connection.getRepository(NodeElementTemplate).findOneOrFail({
        relations: ['outgoing'],
        where: {
          implementation: 'startEvent',
        },
      })
      expect(startEvent.outgoing && startEvent.outgoing.length).toBe(1)

      const endEvent = await connection.getRepository(NodeElementTemplate).findOneOrFail({
        relations: ['incoming'],
        where: {
          implementation: 'endEvent',
        },
      })
      expect(endEvent.incoming && endEvent.incoming.length).toBe(1)

      const tasks = await connection.getRepository(NodeElementTemplate).find({
        relations: ['incoming', 'outgoing'],
        where: {
          implementation: 'task',
        },
      })
      expect(tasks).toBeArrayOfSize(3)
      tasks.forEach(task => {
        expect(task.incoming).toBeArrayOfSize(1)
        expect(task.outgoing).toBeArrayOfSize(1)
      })

      const gateways = await connection.getRepository(NodeElementTemplate).find({
        relations: ['incoming', 'outgoing'],
        where: [
          { implementation: 'parallelGateway' },
          {implementation: 'exclusiveGateway' },
          {implementation: 'inclusiveGateway' },
        ],
      })
      expect(gateways).toBeArrayOfSize(2)
      // expect(gateways[0].type).toBe(GatewayType.Parallel)
      expect(gateways[0].incoming).toBeArrayOfSize(1)
      expect(gateways[0].outgoing).toBeArrayOfSize(2)
      // expect(gateways[1].type).toBe(GatewayType.Parallel)
      expect(gateways[1].incoming).toBeArrayOfSize(2)
      expect(gateways[1].outgoing).toBeArrayOfSize(1)

      const sequences = await connection.getRepository(SequenceFlowTemplate).find({
        relations: ['source', 'target'],
      })
      expect(sequences).toBeArrayOfSize(7)
      sequences.forEach(sequence => {
        expect(sequence.source).toBeDefined()
        expect(sequence.target).toBeDefined()
      })
    })

    it('Diagram simple_gateways', async() => {
      let xml = readFileSync(joinPath(
        __dirname,
        '../resources/bpmn/simple_gateways.bpmn',
      ), 'utf8').toString()

      let builder = new BpmnBuilder(connection)
      await builder.loadFromXml(xml)

      const process = await connection.getRepository(ProcessTemplate).findOneOrFail()

      const startEvent = await connection.getRepository(NodeElementTemplate).findOneOrFail({
        relations: ['outgoing'],
        where: {
          implementation: 'startEvent',
        },
      })
      expect(startEvent.outgoing).toBeArrayOfSize(1)

      const endEvents = await connection.getRepository(NodeElementTemplate).find({
        relations: ['incoming'],
        where: {
          implementation: 'endEvent',
        },
      })
      expect(endEvents).toBeArrayOfSize(7)
      endEvents.forEach(event => {
        expect(event.incoming).toBeArrayOfSize(1)
      })

      // const gateways = await connection.getRepository(NodeElementTemplate).find({
      //   relations: ['incoming', 'outgoing'],
      // })
      // expect(gateways.length).toBe(3)
      // gateways.forEach(gateway => {
      //   let name = gateway.name
      //   if (name === 'XOR') {
      //     expect(gateway.type).toBe(GatewayType.Exclusive)
      //   }
      //   else if (name === 'AND') {
      //     expect(gateway.type).toBe(GatewayType.Parallel)
      //   }
      //   else if (name === 'OR') {
      //     expect(gateway.type).toBe(GatewayType.Inclusive)
      //   }
      //   else {
      //     throw new Error(`Nelze urcit dle nazvu '${name}'.`)
      //   }
      //   expect(gateway.incoming).toBeArrayOfSize(1)
      //   expect(gateway.outgoing).toBeArrayOfSize(3)
      // })

    })

    it('Diagram tasks_and_gates', async() => {

      let xml = readFileSync(joinPath(
        __dirname,
        '../resources/bpmn/tasks_and_gates.bpmn',
      ), 'utf8').toString()

      let builder = new BpmnBuilder(connection)
      await builder.loadFromXml(xml)

      const process = await connection.getRepository(ProcessTemplate).findOneOrFail()

      const startEvent = await connection.getRepository(NodeElementTemplate).findOneOrFail({
        relations: ['outgoing'],
        where: {
          implementation: 'startEvent',
        },
      })
      expect(startEvent.outgoing).toBeArrayOfSize(1)

      const endEvents = await connection.getRepository(NodeElementTemplate).find({
        relations: ['incoming'],
        where: {
          implementation: 'endEvent',
        },
      })
      expect(endEvents).toBeArrayOfSize(3)
      endEvents.forEach(event => {
        expect(event.incoming).toBeArrayOfSize(1)
      })

      const tasks = await connection.getRepository(NodeElementTemplate).find({
        relations: ['incoming', 'outgoing'],
        where: {
          implementation: 'task',
        },
      })
      expect(tasks).toBeArrayOfSize(4)
      tasks.forEach(task => {
        expect(task.incoming).toBeArrayOfSize(1)
        expect(task.outgoing).toBeArrayOfSize(1)
      })

      const scriptTasks = await connection.getRepository(NodeElementTemplate).find({
        relations: ['incoming', 'outgoing'],
        where: {
          implementation: 'scriptTask',
        },
      })
      expect(scriptTasks).toBeArrayOfSize(3)
      scriptTasks.forEach(task => {
        expect(task.incoming).toBeArrayOfSize(1)
        expect(task.outgoing).toBeArrayOfSize(1)
      })

      // const gateways = await connection.getRepository(NodeElementTemplate).find({
      //   relations: ['incoming', 'outgoing', 'outgoing.sequenceFlow', 'default'],
      // })
      // expect(gateways).toBeArrayOfSize(3)
      // const parallel = gateways.filter(g => g.type === GatewayType.Parallel)
      // const exclusive = gateways.filter(g => g.type === GatewayType.Exclusive)
      // expect(parallel).toBeArrayOfSize(2)
      // expect(exclusive).toBeArrayOfSize(1)
      // exclusive.forEach(gate => {
      //   expect(gate.incoming).toBeArrayOfSize(1)
      //   expect(gate.outgoing).toBeArrayOfSize(2)
      //   expect(gate.default).toBeDefined()

      //   let match = 0
      //   gate.outgoing && gate.outgoing.forEach(outgoing => {
      //     if (outgoing.sequenceFlow
      //       && gate.default
      //       && outgoing.sequenceFlow.id === gate.default.id
      //     ) {
      //       match++
      //     }
      //   })
      //   expect(match).toBe(1)

      // })

    })

  })
})

// function commonExcect4Task<T extends TaskTemplate>(entity: T, relations: (keyof TaskTemplate)[] = [])  {
//   if (relations.includes('incoming')) {
//     expect(entity.incoming).toBeArrayOfSize(1)
//   }
//   if (relations.includes('outgoing')) {
//     expect(entity.outgoing).toBeArrayOfSize(1)
//     expect(true).toBeFalsy()
//   }
// }
// function commonExcect4Tasks<T extends TaskTemplate>(entitys: T[], relations: (keyof TaskTemplate)[] = []) {
//   entitys.forEach(entity => commonExcect4Task(entity, relations))
// }
