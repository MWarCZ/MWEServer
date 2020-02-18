import { Constructor } from 'types/constructor'

import {
  BaseElementInstance,
  BaseElementTemplate,
  DataObjectInstance,
  DataObjectTemplate,
  FlowElementInstance,
  FlowElementTemplate,
  NodeElementInstance,
  NodeElementTemplate,
  ProcessInstance,
  ProcessTemplate,
  SequenceFlowInstance,
  SequenceFlowTemplate,
} from '../entity/bpmn'


export const ConvertTemplate2InstanceMap = {
  [BaseElementTemplate.name]: BaseElementInstance ,
  [DataObjectTemplate.name]: DataObjectInstance,
  [FlowElementTemplate.name]: FlowElementInstance,
  [ProcessTemplate.name]: ProcessInstance,
  [SequenceFlowTemplate.name]: SequenceFlowInstance,
  [NodeElementTemplate.name]: NodeElementInstance,
}
// as {
//   [x: string]: Constructor<BaseElementInstance> | undefined
// }

export const ConvertInstance2TemplateMap = {
  [BaseElementInstance.name]: BaseElementTemplate,
  [DataObjectInstance.name]: DataObjectTemplate,
  [FlowElementInstance.name]: FlowElementTemplate,
  [ProcessInstance.name]: ProcessTemplate,
  [SequenceFlowInstance.name]: SequenceFlowTemplate,
  [NodeElementInstance.name]: NodeElementTemplate,
}


export const ConvertString2TemplateMap = {
  BaseElementTemplate,
  DataObjectTemplate,
  FlowElementTemplate,
  ProcessTemplate,
  SequenceFlowTemplate,
  NodeElementTemplate,
}

export const ConvertString2InstanceMap = {
  BaseElementInstance,
  DataObjectInstance,
  FlowElementInstance,
  ProcessInstance,
  SequenceFlowInstance,
  NodeElementInstance,
}

export function convertTemplate2Instance<
  T extends BaseElementTemplate,
  I extends BaseElementInstance,
>(
  templateClass: Constructor<T>,
) {
  return ConvertTemplate2InstanceMap[templateClass.name] as Constructor<I> | undefined
}

export function convertInstance2Template<
  T extends BaseElementTemplate,
  I extends BaseElementInstance,
>(
  instanceClass: (new () => I),
) {
  return ConvertInstance2TemplateMap[instanceClass.name] as Constructor<T> | undefined
}

export function convertString2Template<
  T extends BaseElementTemplate,
  I extends BaseElementInstance,
>(
  templateClass: string,
) {
  return ConvertString2TemplateMap[templateClass as 'BaseElementTemplate'] as Constructor<T> | undefined
}

export function convertString2Instance<
  T extends BaseElementTemplate,
  I extends BaseElementInstance,
>(
  instanceClass: string,
): undefined | typeof BaseElementInstance {
  return ConvertString2InstanceMap[instanceClass as 'BaseElementInstance'] as Constructor<I> | undefined
}
