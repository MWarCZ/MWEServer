import 'jest-extended'

import { readFileSync } from 'fs'
import { join as joinPath } from 'path'
import { Connection } from 'typeorm'

import { BpmnBuilder } from '../../src/bpmnBuilder'
import { BpmnRunner } from '../../src/bpmnRunner'
import { NodeElementTemplate } from '../../src/entity/bpmn'
import { cleanDataInTables, closeConn, createConn } from '../../src/utils/db'

let connection: Connection

describe('Testy s bpmnRunner', () => {

  beforeEach(async () => {
    connection = await createConn()
    await cleanDataInTables(connection, connection.entityMetadatas)
  })
  afterEach(async () => {
    await closeConn(connection)
  })
  it('xxx', async()=>{

    let xml = readFileSync(joinPath(
      __dirname,
      '../resources/bpmn/simple.bpmn',
    ), 'utf8').toString()

    let builder = new BpmnBuilder(connection)
    await builder.loadFromXml(xml)
    let runner = new BpmnRunner(connection)

    let startEvent = await connection.manager.findOneOrFail(NodeElementTemplate, {
      implementation: 'startEvent',
    })
    let processI = await runner.initAndSaveProcess(
      { id: startEvent.processTemplateId as number },
      startEvent,
    )
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
