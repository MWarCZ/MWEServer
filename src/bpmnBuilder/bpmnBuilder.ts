import { parse, validate } from 'fast-xml-parser'
import { Connection } from 'typeorm'

import { options as fxpOptions } from './fxp.config'
import { BpmnNamespace } from './namespace'
import { Parser } from './parser'


export class BpmnBuilder {
  ns: BpmnNamespace = {
    xsi: '',
    bpmn2: '',
    bpmndi: '',
    dc: '',
    di: '',
    camunda: '',
    mwe: '',
  }
  parser: Parser
  connection: Connection

  constructor(connection: Connection) {
    this.connection = connection
    this.parser = new Parser()
  }

  async loadFromFxp(dataFxp: any ) {
    const definitions = this.parser.parseDefinitions(dataFxp)
    this.parser.loadNamespaces(definitions)
    const level1 = this.parser.parseLevel1(definitions)
    const level2 = level1.Process.map(process => this.parser.parseLevel2(process))

    let process = new Set(level1.Process.map(e => e.entity))
    await this.connection.manager.save([...process])

    await Promise.all(
      level2.map(async(level) => {
        // NUTNE zachovat porad!
        let dataObjects = new Set(level.DataObject.map(e => e.entity).filter(e => !!e))
        await this.connection.manager.save([...dataObjects])

        let tasks = new Set(level.Task.map(e => e.entity).filter(e => !!e))
        let startEvents = new Set(level.StartEvent.map(e => e.entity).filter(e => !!e))
        let endEvents = new Set(level.EndEvent.map(e => e.entity).filter(e => !!e))
        let gateways = new Set(level.Gateway.map(e => e.entity).filter(e => !!e))
        let scriptTasks = new Set(level.ScriptTask.map(e => e.entity).filter(e => !!e))
        await this.connection.manager.save([
          ...tasks,
          ...startEvents,
          ...endEvents,
          ...gateways,
          ...scriptTasks,
        ])

        let sequenceFlows = new Set(level.SequenceFlow.map(e => e.entity).filter(e => !!e))
        await this.connection.manager.save([...sequenceFlows])
      }),
    )

  }

  async loadFromXml(xmlBpmn: string) {
    validate(xmlBpmn, {
      allowBooleanAttributes: false,
    })

    const data = parse(xmlBpmn, fxpOptions)

    await this.loadFromFxp(data)

  }
}
