///////////////////////////////////////
// Soubor: src/bpmnBuilder/bpmnBuilder.ts
// Projekt: MWEServer
// Autor: Miroslav Válka
///////////////////////////////////////
import { parse, validate } from 'fast-xml-parser'
import { Connection } from 'typeorm'

import { ProcessTemplate } from '../entity/bpmn'
import { options as fxpOptions } from './fxp.config'
import { BpmnNamespace } from './namespace'
import { Parser } from './parser'

/**
 * Stavitel sablon procesu slouzi pro prevod obsahu souboru BPMN do internich objektu databaze.
 */
export class BpmnBuilder {
  /**
   * Naposledy nactene aliasy jmennych prostoru.
   */
  ns: BpmnNamespace = {
    xsi: '',
    bpmn2: '',
    bpmndi: '',
    dc: '',
    di: '',
    camunda: '',
    mwe: '',
  }
  /**
   * Instance parseru pouzivana pro prevody dat
   * o podnikovych procesech na interni entity pro ulozeni do databaze.
   */
  parser: Parser
  /**
   * Pripojeni k databazi.
   */
  connection: Connection

  constructor(connection: Connection) {
    this.connection = connection
    this.parser = new Parser()
  }

  /**
   * Provadi zpracovani dat obsahujici podnikovy proces, jejich prevod na interni entity
   * a jejich nasledne ulozeni do databaze.
   * @param dataFxp Data nesouci informace o procesech, ktera vznikla pomoci balicku `fast-xml-parser`.
   */
  async loadFromFxp(dataFxp: any ) {
    const definitions = this.parser.parseDefinitions(dataFxp)
    this.ns = this.parser.loadNamespaces(definitions)
    const level1 = this.parser.parseLevel1(definitions)
    const level2 = level1.Process.map(process => this.parser.parseLevel2(process))

    let process = new Set(level1.Process.map(e => e.entity))
    let savedProcess: ProcessTemplate[] = []
    await this.connection.transaction(async manager => {

      savedProcess = await manager.save([...process])

      await Promise.all(
        level2.map(async(level) => {
          // NUTNE zachovat porad!
          let dataObjects = new Set(level.DataObject.map(e => e.entity).filter(e => !!e))
          await manager.save([...dataObjects])

          let nodeElements = [
            ...level.Task,
            ...level.StartEvent,
            ...level.EndEvent,
            ...level.Gateway,
            ...level.ScriptTask,
            ...level.ServiceTask,
            ...level.SendTask,
            ...level.ReceiveTask,
            ...level.UserTask,
            ...level.ManualTask,
            ...level.CallActivity,
            ...level.BusinessRuleTask,
            ...level.IntermediateThrowEvent,
            ...level.IntermediateCatchEvent,
          ].map(e => e.entity).filter(e => !!e)
          await manager.save([...new Set(nodeElements)])

          let sequenceFlows = new Set(level.SequenceFlow.map(e => e.entity).filter(e => !!e))
          await manager.save([...sequenceFlows])
        }),
      )
    })
    console.log('=====================')
    console.log(savedProcess)
    return savedProcess
    // return [...process]
  }

  /**
   * Provadi zakladni validaci zpracovavaneho textu XML, ktery je nasledovan
   * prevodem dat v XML na interni entity a k jejich ulozeni do databaze.
   * @see loadFromFxp
   * @param xmlBpmn Obsah souboru BPMN, ktery nese informace o podkinovych procesech.
   */
  async loadFromXml(xmlBpmn: string) {
    validate(xmlBpmn, {
      allowBooleanAttributes: false,
    })

    const data = parse(xmlBpmn, fxpOptions)

    let process = await this.loadFromFxp(data)
    return process
  }
}
