import { Constructor } from 'types/constructor'

import {
  BaseElementInstance,
  BaseElementTemplate,
  DataObjectInstance,
  DataObjectTemplate,
  NodeElementInstance,
  NodeElementTemplate,
  ProcessInstance,
  ProcessTemplate,
  SequenceFlowInstance,
  SequenceFlowTemplate,
} from '../entity/bpmn'


export const ConvertTemplate2InstanceMap = {
  [DataObjectTemplate.name]: DataObjectInstance,
  [ProcessTemplate.name]: ProcessInstance,
  [SequenceFlowTemplate.name]: SequenceFlowInstance,
  [NodeElementTemplate.name]: NodeElementInstance,
} as {
  [x: string]: Constructor<BaseElementInstance> | undefined
}

export const ConvertInstance2TemplateMap = {
  [DataObjectInstance.name]: DataObjectTemplate,
  [ProcessInstance.name]: ProcessTemplate,
  [SequenceFlowInstance.name]: SequenceFlowTemplate,
  [NodeElementInstance.name]: NodeElementTemplate,
} as {
  [x: string]: Constructor<BaseElementTemplate> | undefined
}


export const ConvertString2TemplateMap = {
  DataObjectTemplate,
  ProcessTemplate,
  SequenceFlowTemplate,
  NodeElementTemplate,
} as {
  [x: string]: Constructor<BaseElementTemplate> | undefined
}

export const ConvertString2InstanceMap = {
  DataObjectInstance,
  ProcessInstance,
  SequenceFlowInstance,
  NodeElementInstance,
} as {
  [x: string]: Constructor<BaseElementInstance> | undefined
}

export function convertTemplate2Instance<
  T extends BaseElementTemplate,
  I extends BaseElementInstance,
>(
  templateClass: Constructor<T>,
) {
  return ConvertTemplate2InstanceMap[templateClass.name] //as Constructor<I> | undefined
}

export function convertInstance2Template<
  T extends BaseElementTemplate,
  I extends BaseElementInstance,
>(
  instanceClass: (new () => I),
) {
  return ConvertInstance2TemplateMap[instanceClass.name] //as Constructor<T> | undefined
}

export function convertString2Template<
  T extends BaseElementTemplate,
  I extends BaseElementInstance,
>(
  templateClass: string,
) {
  return ConvertString2TemplateMap[templateClass] //as Constructor<T> | undefined
}

export function convertString2Instance<
  T extends BaseElementTemplate,
  I extends BaseElementInstance,
>(
  instanceClass: string,
) {
  return ConvertString2InstanceMap[instanceClass] //as Constructor<I> | undefined
}
