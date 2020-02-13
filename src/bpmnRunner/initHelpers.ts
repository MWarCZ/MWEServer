import {
  ActivityStatus,
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
  SequenceFlowInstance,
  SequenceFlowTemplate,
  StartEventInstance,
  StartEventTemplate,
  TaskInstance,
  TaskTemplate,
} from '../entity/bpmn'
import { ObjectType } from '../types/objectType'


//#region Pomocne funkce vytvarejici ze sablon instance.

export function createProcess(process: ProcessTemplate): ProcessInstance {
  const processInstance = new ProcessInstance()
  processInstance.processTemplate = process
  processInstance.status = ActivityStatus.Ready

  return processInstance
}

export function createInstance<T extends BaseElementTemplate, I extends FlowElementInstance>(
  instance: ObjectType < I >,
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

//#region Pomocne funkce pro testovani

export function checkIsElementInsideProcess<T extends FlowElementTemplate>(
  process: ProcessTemplate | { id?: number },
  child: T | { processTemplateId?: number },
  childClass: ObjectType < T >,
) {
  let idFromChild: number | undefined = child.processTemplateId
  if (child instanceof FlowElementTemplate && child.processTemplate){
    idFromChild = child.processTemplate.id
  }
  if (typeof idFromChild === 'undefined') {
    throw new Error(`Element '${childClass.name}' nepatri do zadneho procesu.`)
  }
  let idFromProcess: number | undefined = process.id
  if (typeof idFromProcess === 'undefined') {
    throw new Error(`Sablone '${ProcessTemplate.name}(${process.id})' chybi identifikator (id).`)
  }
  if (idFromChild !== idFromProcess) {
    throw new Error(`Sablona '${ProcessTemplate.name}(${process.id})' neobsahuje element '${childClass.name}'.`)
  }
}

//#endregion

//#region Funkce InitNewXXX - Kontrola, vytvoreni instance.

export function initNewElement<T extends FlowElementTemplate, I extends FlowElementInstance>(
  options: {
    templateClass: ObjectType<T>,
    instanceClass: ObjectType<I>,
    processInstance: ProcessInstance,
    elementTemplate: T,
    callSetup?: (elementInstance: I, elementTemplate: T) => I,
    disableCheckIsElementInsideProcess?: boolean,
  }
): I {
  const {
    templateClass,
    instanceClass,
    processInstance,
    elementTemplate,
    callSetup,
    disableCheckIsElementInsideProcess,
  } = options

  // najdi id sablony procesu
  let processTemplateId = processInstance.processTemplateId || ( processInstance.processTemplate && processInstance.processTemplate.id)
  if (!disableCheckIsElementInsideProcess) {
    checkIsElementInsideProcess(
      { id: processTemplateId },
      elementTemplate,
      templateClass,
    )
  }

  let elementI = createInstance(instanceClass, elementTemplate, processInstance)

  if (typeof callSetup === 'function') {
    elementI = callSetup(elementI, elementTemplate)
  }
  return elementI
}

export function initNewProcess(
  processTemplate: ProcessTemplate,
): ProcessInstance {
  let processI = createProcess(processTemplate)
  return processI
}

export function initNewStartEvent(
  processInstance: ProcessInstance,
  eventTemplate: StartEventTemplate,
): StartEventInstance {
  return initNewElement({
    templateClass: StartEventTemplate,
    instanceClass: StartEventInstance,
    elementTemplate: eventTemplate,
    processInstance,
  })
}

export function initNewEndEvent(
  processInstance: ProcessInstance,
  eventTemplate: EndEventTemplate,
): EndEventInstance {
  return initNewElement({
    templateClass: EndEventTemplate,
    instanceClass: EndEventInstance,
    elementTemplate: eventTemplate,
    processInstance,
  })
}

export function initNewGateway(
  processInstance: ProcessInstance,
  gatewayTemplate: GatewayTemplate,
): GatewayInstance {
  return initNewElement({
    templateClass: GatewayTemplate,
    instanceClass: GatewayInstance,
    elementTemplate: gatewayTemplate,
    processInstance,
  })
}

export function initNewTask(
  processInstance: ProcessInstance,
  taskTemplate: TaskTemplate,
): TaskInstance {
  return initNewElement({
    templateClass: TaskTemplate,
    instanceClass: TaskInstance,
    elementTemplate: taskTemplate,
    processInstance,
  })
}

export function initNewScriptTask(
  processInstance: ProcessInstance,
  taskTemplate: ScriptTaskTemplate,
): ScriptTaskInstance {
  return initNewElement({
    templateClass: ScriptTaskTemplate,
    instanceClass: ScriptTaskInstance,
    elementTemplate: taskTemplate,
    processInstance,
  })
}

export function initNewDataObject(
  processInstance: ProcessInstance,
  dataObjectTemplate: DataObjectTemplate,
): DataObjectInstance {
  return initNewElement({
    templateClass: DataObjectTemplate,
    instanceClass: DataObjectInstance,
    elementTemplate: dataObjectTemplate,
    processInstance,
    callSetup: (instance, template) => {
      instance.data = template.json
      return instance
    },
  })
}

export function initNewSequenceFlow(
  processInstance: ProcessInstance,
  sequenceTemplate: SequenceFlowTemplate,
): SequenceFlowInstance {
  return initNewElement({
    templateClass: SequenceFlowTemplate,
    instanceClass: SequenceFlowInstance,
    elementTemplate: sequenceTemplate,
    processInstance,
  })
}

  //#endregion
