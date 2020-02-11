import { Connection } from 'typeorm'

import {
  DataObjectInstance,
  DataObjectTemplate,
  EndEventInstance,
  EndEventTemplate,
  FlowElementInstance,
  FlowElementTemplate,
  GatewayInstance,
  GatewayTemplate,
  ProcessInstance,
  ProcessTemplate,
  ScriptTaskInstance,
  ScriptTaskTemplate,
  StartEventInstance,
  StartEventTemplate,
  TaskInstance,
  TaskTemplate,
} from '../entity/bpmn'
import { ObjectType } from '../types/objectType'
import { getInstance, getTemplate } from './anotherHelpers'
import * as InitHelpers from './initHelpers'


/*
  [x] Vytvorit instanci procesu. PT => PI
    [x] Vytvorit instanci procesu.
    [x] Vytvorit instanci udalosti, ktera spistila proces.
  [ ] Vytvorit instanci ulohy. TT => TI
    [x] Task
    [x] ScriptTask
    [ ] ...
  [x] Vytvorit instanci udalosti. ET => EI
    [x] StartEvent
    [x] EndEvent
  [x] Vytvorit instanci brany. GT => GI
  [x] Vytvorit instanci dat.
    [x] DataObject

  [ ] Zpracovat instanci ulohy. TI
  [ ] Zpracovat instanci udalosti. EI
  [ ] Zpracovat instanci brany. GI

  [ ] Vytvorit nasledujici instance
  [ ] Poskladat datovy kontext (pr. pro data ulohy, pro data k vyhodnoceni vyrazu, ...)

*/

export class BpmnRunner {

  connection: Connection

  constructor(connection: Connection) {
    this.connection = connection
  }


  //#region Funkce InitXXX - Kontrola, vytvoreni instance, ulozeni instance.

  private async initAndSaveElement<T extends FlowElementTemplate, I extends FlowElementInstance>(
    options: {
      templateClass: ObjectType<T>,
      elementTemplate: { id: number } | T,
      processInstance: { id: number } | ProcessInstance,
      callInitNew: (processInstance: ProcessInstance, elementTemplate: T) => I,
    }
  ): Promise<I> {
    const {
      templateClass,
      processInstance,
      elementTemplate,
      callInitNew,
    } = options

    let processI = await getInstance({
      instanceClass: ProcessInstance,
      entityOrId: processInstance,
      typeormConnection: this.connection,
    })
    let elementT = await getTemplate({
      templateClass,
      entityOrId: elementTemplate,
      typeormConnection: this.connection,
    })

    let elementI = callInitNew(processI, elementT)

    elementI = await this.connection.manager.save(elementI)
    return elementI
  }

  async initProcess(
    processTemplate: { id: number } | ProcessTemplate,
    startEvent: { id: number } | StartEventTemplate,
  ): Promise<ProcessInstance> {
    // Vyhledani sablon
    let processT = await getTemplate({
      templateClass: ProcessTemplate,
      entityOrId: processTemplate,
      typeormConnection: this.connection,
    })
    let startEventT = await getTemplate({
      templateClass: StartEventTemplate,
      entityOrId: startEvent,
      typeormConnection: this.connection,
    })

    // Vytvoreni instance procesu
    let processInstance = InitHelpers.initNewProcess(processT)
    processInstance = await this.connection.manager.save(processInstance)

    // Vytvoreni instance prvniho startovaciho eventu
    await this.initStartEvent(processInstance, startEventT)

    return processInstance
  }

  initStartEvent(
    processInstance: { id: number } | ProcessInstance,
    event: { id: number } | StartEventTemplate,
  ): Promise<StartEventInstance> {
    return this.initAndSaveElement({
      callInitNew: InitHelpers.initNewStartEvent,
      processInstance,
      elementTemplate: event,
      templateClass: StartEventTemplate,
    })
  }

  initEndEvent(
    processInstance: { id: number } | ProcessInstance,
    event: { id: number } | EndEventTemplate,
  ): Promise<EndEventInstance> {
    return this.initAndSaveElement({
      callInitNew: InitHelpers.initNewEndEvent,
      processInstance,
      elementTemplate: event,
      templateClass: EndEventTemplate,
    })
  }

  initGateway(
    processInstance: { id: number } | ProcessInstance,
    gateway: { id: number } | GatewayTemplate,
  ): Promise<GatewayInstance> {
    return this.initAndSaveElement({
      callInitNew: InitHelpers.initNewGateway,
      processInstance,
      elementTemplate: gateway,
      templateClass: GatewayTemplate,
    })
  }

  initTask(
    processInstance: { id: number } | ProcessInstance,
    task: { id: number } | TaskTemplate,
  ): Promise<TaskInstance> {
    return this.initAndSaveElement({
      callInitNew: InitHelpers.initNewTask,
      processInstance,
      elementTemplate: task,
      templateClass: TaskTemplate,
    })
  }

  initScriptTask(
    processInstance: { id: number } | ProcessInstance,
    task: { id: number } | ScriptTaskTemplate,
  ): Promise<ScriptTaskInstance> {
    return this.initAndSaveElement({
      callInitNew: InitHelpers.initNewScriptTask,
      processInstance,
      elementTemplate: task,
      templateClass: ScriptTaskTemplate,
    })
  }

  initDataObject(
    processInstance: { id: number } | ProcessInstance,
    dataObject: { id: number } | DataObjectTemplate,
  ): Promise<DataObjectInstance> {
    return this.initAndSaveElement({
      callInitNew: InitHelpers.initNewDataObject,
      processInstance,
      elementTemplate: dataObject,
      templateClass: DataObjectTemplate,
    })
  }

  //#endregion

}
