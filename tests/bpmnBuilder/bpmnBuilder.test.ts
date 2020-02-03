import { Connection } from 'typeorm'

import { BpmnBuilder } from '../../src/bpmnBuilder'
import { DataObjectTemplate } from '../../src/entity/bpmn/dataObject'
import { EndEventTemplate } from '../../src/entity/bpmn/endEvent'
import { ProcessTemplate, ProcessType } from '../../src/entity/bpmn/process'
import { SequenceFlowTemplate } from '../../src/entity/bpmn/sequenceFlow'
import { StartEventTemplate } from '../../src/entity/bpmn/startEvent'
import { TaskTemplate } from '../../src/entity/bpmn/task'
import { cleanDataInTables, closeConn, createConn } from '../../src/utils/db'

let connection: Connection

describe('Testy prevodu XML na interni entity DB', () => {
  beforeEach(async () => {
    connection = await createConn()
    await cleanDataInTables(connection, connection.entityMetadatas)
  })
  afterEach(async () => {
    await closeConn(connection)
  })

  it('Jednoduchy diagram', async ()=>{
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
          source: 'ID_SE_1'
        },
        {
          id: 'ID_SF_2',
          target: 'ID_EE_1',
          source: 'ID_TASK_1'
        },
      ]
    }
    const builder = new BpmnBuilder(connection)
    await builder.loadFromXml(`<?xml version="1.0" encoding="UTF-8"?>
      <bpmn:definitions
        xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL"
        xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI"
        xmlns:dc="http://www.omg.org/spec/DD/20100524/DC"
        xmlns:di="http://www.omg.org/spec/DD/20100524/DI"
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
          <bpmn:dataObject name='DATA' id="DataObject_1" />

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

    const startEvent = await connection.getRepository(StartEventTemplate).findOneOrFail({
      relations: ['outgoing']
    })
    expect(startEvent.outgoing && startEvent.outgoing.length).toBe(1)

    const endEvent = await connection.getRepository(EndEventTemplate).findOneOrFail({
      relations: ['incoming']
    })
    expect(endEvent.incoming && endEvent.incoming.length).toBe(1)

    const dataObject = await connection.getRepository(DataObjectTemplate).findOneOrFail()
    expect(dataObject.name).toBe('DATA')
    expect(dataObject.strict).toBeFalsy()
    expect(dataObject.json).toMatchObject({})

    const task = await connection.getRepository(TaskTemplate).findOneOrFail({
      relations: ['incoming', 'outgoing', 'inputs', 'outputs']
    })
    expect(task.incoming && task.incoming.length).toBe(1)
    expect(task.outgoing && task.outgoing.length).toBe(1)
    expect(task.inputs && task.inputs.length).toBe(1)
    expect(task.outputs && task.outputs.length).toBe(1)

    const sequences = await connection.getRepository(SequenceFlowTemplate).find({
      relations: ['source', 'target']
    })
    expect(sequences.length).toBe(2)
    sequences.forEach(sequence => {
      expect(sequence.source).toBeDefined()
      expect(sequence.target).toBeDefined()
    })


  })
})

