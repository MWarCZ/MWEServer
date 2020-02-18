import {
  ActivityStatus,
  DataObjectInstance,
  DataObjectTemplate,
  FlowElementInstance,
  FlowElementTemplate,
  NodeElementInstance,
  NodeElementTemplate,
  ProcessInstance,
  ProcessStatus,
  ProcessTemplate,
  SequenceFlowInstance,
  SequenceFlowTemplate,
} from '../entity/bpmn'
import { Constructor } from '../types/constructor'
import { convertTemplate2Instance } from '../utils/entityHelpers'


//#region Pomocne funkce vytvarejici ze sablon instance.

export function createProcess(process: ProcessTemplate): ProcessInstance {
  const processInstance = new ProcessInstance()
  processInstance.processTemplate = process
  processInstance.status = ProcessStatus.Ready

  return processInstance
}

export function createInstance<T extends FlowElementTemplate, I extends FlowElementInstance>(
  instance: Constructor<I>,
  template: T,
  process: ProcessInstance,
): I {
  const entityInstance = new instance()
  entityInstance.processInstance = process
  entityInstance.template = template
  if (entityInstance instanceof NodeElementInstance) {
    entityInstance.status = ActivityStatus.Ready
  }
  return entityInstance
}

//#endregion

//#region Pomocne funkce pro testovani

export function checkIsElementInsideProcess<T extends FlowElementTemplate>(
  process: ProcessTemplate | { id?: number },
  child: T | { processTemplateId?: number },
  childClass: Constructor < T >,
) {
  let idFromChild: number | undefined = child.processTemplateId
  if (child instanceof FlowElementTemplate && child.processTemplate) {
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
    templateClass: Constructor<T>,
    processInstance: ProcessInstance,
    elementTemplate: T,
    callSetup?: (elementInstance: I, elementTemplate: T) => I,
    disableCheckIsElementInsideProcess?: boolean,
  },
): I {
  const {
    templateClass,
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
  const instanceClass = convertTemplate2Instance(templateClass) as Constructor<I>
  if(!instanceClass) {
    throw new Error('Instance nenalezena')
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

export function initNewNodeElement(
  processInstance: ProcessInstance,
  nodeTemplate: NodeElementTemplate,
): NodeElementInstance {
  return initNewElement({
    templateClass: NodeElementTemplate,
    elementTemplate: nodeTemplate,
    processInstance,
  })
}

export function initNewDataObject(
  processInstance: ProcessInstance,
  dataObjectTemplate: DataObjectTemplate,
): DataObjectInstance {
  return initNewElement({
    templateClass: DataObjectTemplate,
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
    elementTemplate: sequenceTemplate,
    processInstance,
  })
}

//#endregion
