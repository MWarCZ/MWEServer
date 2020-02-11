import { Connection, Equal, In } from 'typeorm'

import {
  ActivityStatus,
  BaseElementInstance,
  BaseElementTemplate,
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
} from './entity/bpmn'

type ObjectType<T> = {
  new(): T,
}

/*
  [ ] Vytvorit instanci procesu. PT => PI
    [x] Vytvorit instanci procesu.
    [x] Vytvorit instanci udalosti, ktera spistila proces.
    [ ] Vytvorit instastance vsech datovych objektu daneho procesu.
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

/*
  $INPUT
 */
type BpmnRunContext = {
  $GLOBAL: any,
  $INPUT: {
    [dataObjectName: string]: any,
  },
}


export class BpmnRunner {

  connection: Connection

  constructor(connection: Connection) {
    this.connection = connection
  }

  //#region Pomocne funkce vytvarejici ze sablon instance.

  createProcess(process: ProcessTemplate): ProcessInstance {
    const processInstance = new ProcessInstance()
    processInstance.processTemplate = process
    processInstance.status = ActivityStatus.Ready

    return processInstance
  }

  createInstance<T extends BaseElementTemplate, I extends FlowElementInstance>(
    instance: ObjectType<I>,
    template: T,
    process: ProcessInstance,
  ): I {
    const entityInstance = new instance()
    entityInstance.processInstance = process
    entityInstance.template = template
    entityInstance.status = ActivityStatus.Ready
    return entityInstance
  }

  //#endregion
  //#region Pomocne funkce k ziskani sablony z sablony ci id_sablony.

  async getTemplate<T extends BaseElementTemplate>(
    templateClass: ObjectType<T>,
    entityOrId: { id: number } | T,
  ): Promise<T> {

    if (entityOrId instanceof templateClass) {
      return entityOrId
    }
    let res = await this.connection.getRepository(templateClass).findOne(entityOrId.id)
    if (!res) {
      throw new Error(`Sablona '${templateClass.name}(${entityOrId.id})' nenalezena.`)
    }
    return res
  }

  async getInstance<T extends BaseElementInstance>(
    instanceClass: ObjectType<T>,
    entityOrId: { id: number } | T,
  ): Promise<T> {

    if (entityOrId instanceof instanceClass) {
      return entityOrId
    }
    let res = await this.connection.getRepository(instanceClass).findOne(entityOrId.id)
    if (!res) {
      throw new Error(`Instance '${instanceClass.name}' nenalezena.`)
    }
    return res
  }

  //#endregion

  checkIsElementInsideProcess<T extends FlowElementTemplate>(
    process: ProcessTemplate | { id?: number },
    child: T | { processTemplateId?: number },
    childClass: ObjectType<T>,
  ) {
    if (child.processTemplateId !== process.id) {
      throw new Error(`Sablona '${ProcessTemplate.name}(${process.id})' neobsahuje '${childClass.name}'.`)
    }
  }

  //#region Funkce InitXXX - Kontrola, vytvoreni instance, ulozeni instance.

  async initElement<T extends FlowElementTemplate, I extends FlowElementInstance>(
    templateClass: ObjectType<T>,
    instanceClass: ObjectType<I>,
    processInstance: { id: number } | ProcessInstance,
    elementTemplate: { id: number } | T,
    callSetup?: (elementInstance: I, elementTemplate: T) => I,
  ): Promise<I> {
    let processI = await this.getInstance(ProcessInstance, processInstance)
    let elementT = await this.getTemplate(templateClass, elementTemplate)

    this.checkIsElementInsideProcess({ id: processI.processTemplateId }, elementT, templateClass)

    let elementI = this.createInstance(instanceClass, elementT, processI)

    if (typeof callSetup === 'function') {
      elementI = callSetup(elementI, elementT)
    }

    await this.connection.manager.save(elementI)
    return elementI
  }

  async initProcess(
    processTemplate: { id: number } | ProcessTemplate,
    startEvent: { id: number } | StartEventTemplate,
  ): Promise<ProcessInstance> {
    // Vyhledani sablon
    let processT = await this.getTemplate(ProcessTemplate, processTemplate)
    let startEventT = await this.getTemplate(StartEventTemplate, startEvent)
    this.checkIsElementInsideProcess(processT, startEventT, StartEventTemplate)

    // Vytvoreni instance procesu
    let processI = this.createProcess(processT)
    await this.connection.manager.save(processI)

    // Vytvoreni instance prvniho startovaciho eventu
    await this.initStartEvent(processI, startEvent)

    return processI
  }

  initStartEvent(
    processInstance: {id: number} | ProcessInstance,
    event: {id: number} | StartEventTemplate ,
  ): Promise<StartEventInstance> {
    return this.initElement(StartEventTemplate, StartEventInstance, processInstance, event)
  }

  initEndEvent(
    processInstance: { id: number } | ProcessInstance,
    event: { id: number } | EndEventTemplate,
  ): Promise<EndEventInstance> {
    return this.initElement(EndEventTemplate, EndEventInstance, processInstance, event)
  }

  initGateway(
    processInstance: { id: number } | ProcessInstance,
    gateway: { id: number } | GatewayTemplate,
  ): Promise<GatewayInstance> {
    return this.initElement(GatewayTemplate, GatewayInstance, processInstance, gateway)
  }

  initTask(
    processInstance: { id: number } | ProcessInstance,
    task: { id: number } | TaskTemplate,
  ): Promise<TaskInstance> {
    return this.initElement(TaskTemplate, TaskInstance, processInstance, task)
  }

  initScriptTask(
    processInstance: { id: number } | ProcessInstance,
    task: { id: number } | ScriptTaskTemplate,
  ): Promise<ScriptTaskInstance> {
    return this.initElement(ScriptTaskTemplate, ScriptTaskInstance, processInstance, task)
  }

  initDataObject(
    processInstance: { id: number } | ProcessInstance,
    dataObject: { id: number } | DataObjectTemplate,
  ): Promise<DataObjectInstance> {
    return this.initElement(
      DataObjectTemplate,
      DataObjectInstance,
      processInstance,
      dataObject,
      (instance, template) => {
        instance.data = template.json
        return instance
      },
    )
  }

  //#endregion


  //#region Funkce RunXXX


  async createContext(taskInstance: { id: number }) {
    // [x] Ziskat instanci ulohy.
    // [x] Ziskat sablonu ulohy.
    // [x] Ziskat datove vstupy dane sablony ulohy.
    // [x] Ziskat existujici instance datovych vstupu.
    //    [x] Stejna instance procesu pro instanci ulohy a instance datoveho objektu.
    //    [x] Instance datoveho objektu je vytvorena dle sablon datovych vstupu sablony ulohy.
    let context: BpmnRunContext = {
      $GLOBAL: {},
      $INPUT: {},
    }

    let taskI = await this.connection.getRepository(TaskInstance).findOneOrFail({
      relations: ['template', 'template.inputs'],
    })
    console.log(JSON.stringify(taskI, null, 2))

    if (taskI && taskI.template && taskI.template.inputs) {
      // DataObjectTemplate pro ulohu
      let taskInputsTemplates = taskI.template.inputs
      // jejich id => DataObjectTemplate.id
      let taskInputsTemplatesIds = taskInputsTemplates.map(d => d.id)
      // DataObjectInstance patrici do instance procesu a zaroven do mnoziny vstupu ulohy
      let taskInputsIntances = await this.connection.getRepository(DataObjectInstance).find({
        processInstanceId: Equal(taskI.processInstanceId),
        templateId: In([...taskInputsTemplatesIds]),
      })
      console.log('DOI:\n', JSON.stringify(taskInputsIntances, null, 2))

      // prochzej DataObjectTemplate
      let data = taskInputsTemplates.map(input => {
       const { name = '', json} = input
       let inputInstance = taskInputsIntances.find(d => d.templateId == input.id)
        return {
          [name]: (inputInstance) ? inputInstance.data : json,
        }
      }).reduce((acc: any, value) => {
        return {
          ...acc,
          ...value,
        }
      }, {})
      console.log('DATA:\n', JSON.stringify(data, null, 2))
      context.$INPUT = data
    }

    // console.log(JSON.stringify(taskX, null, 2))
    return context
  }

  runXXX() {


  }

  //#endregion

  /*
    initXXX => Vytvorit instanci ze sablony nebo z id sablony.
    runXXX => Zpracovat instanci XXX a vytvorit instance pro pokracovani.
    createXXX => Predvytvoreni instance.
    next => zpracovat pokracovani ...?
  */
}
