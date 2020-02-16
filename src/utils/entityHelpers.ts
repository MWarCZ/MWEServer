// import {
//   TaskTemplate, ScriptTaskTemplate, StartEventTemplate, EndEventTemplate,
//   GatewayTemplate, DataObjectTemplate, SequenceFlowTemplate, BasicTaskTemplate,
//   EventTemplate, ProcessTemplate,
// } from '../entity/bpmn'
import {
  BaseElementInstance,
  BaseElementTemplate,
  BasicTaskInstance,
  BasicTaskTemplate,
  DataObjectInstance,
  DataObjectTemplate,
  EndEventInstance,
  EndEventTemplate,
  EventInstance,
  EventTemplate,
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
import * as bpmn from '../entity/bpmn'


const xxx = {...bpmn}

let a = xxx['GatewayTemplate']

export const ConvertTemplate2InstanceMap = {
  [BaseElementTemplate.name]: BaseElementInstance,
  [BasicTaskTemplate.name]: BasicTaskInstance,
  [DataObjectTemplate.name]: DataObjectInstance,
  [EndEventTemplate.name]: EndEventInstance,
  [EventTemplate.name]: EventInstance,
  [FlowElementTemplate.name]: FlowElementInstance,
  [GatewayTemplate.name]: GatewayInstance,
  [ProcessTemplate.name]: ProcessInstance,
  [ScriptTaskTemplate.name]: ScriptTaskInstance,
  [SequenceFlowTemplate.name]: SequenceFlowInstance,
  [StartEventTemplate.name]: StartEventInstance,
  [TaskTemplate.name]: TaskInstance,
}

export const ConvertInstance2TemplateMap = {
  [BaseElementInstance.name]: BaseElementTemplate,
  [BasicTaskInstance.name]: BasicTaskTemplate,
  [DataObjectInstance.name]: DataObjectTemplate,
  [EndEventInstance.name]: EndEventTemplate,
  [EventInstance.name]: EventTemplate,
  [FlowElementInstance.name]: FlowElementTemplate,
  [GatewayInstance.name]: GatewayTemplate,
  [ProcessInstance.name]: ProcessTemplate,
  [ScriptTaskInstance.name]: ScriptTaskTemplate,
  [SequenceFlowInstance.name]: SequenceFlowTemplate,
  [StartEventInstance.name]: StartEventTemplate,
  [TaskInstance.name]: TaskTemplate,
}


export const ConvertString2TemplateMap = {
  BaseElementTemplate,
  BasicTaskTemplate,
  DataObjectTemplate,
  EndEventTemplate,
  EventTemplate,
  FlowElementTemplate,
  GatewayTemplate,
  ProcessTemplate,
  ScriptTaskTemplate,
  SequenceFlowTemplate,
  StartEventTemplate,
  TaskTemplate,
}

export const ConvertString2InstanceMap = {
  BaseElementInstance,
  BasicTaskInstance,
  DataObjectInstance,
  EndEventInstance,
  EventInstance,
  FlowElementInstance,
  GatewayInstance,
  ProcessInstance,
  ScriptTaskInstance,
  SequenceFlowInstance,
  StartEventInstance,
  TaskInstance,
}

export function convertTemplate2Instance<T extends BaseElementTemplate>(
  templateClass: (new () => T ) | typeof BaseElementTemplate,
): undefined | typeof BaseElementInstance  {
  return ConvertTemplate2InstanceMap[templateClass.name]
}
export function convertInstance2Template<T extends BaseElementInstance>(
  instanceClass: (new () => T) | typeof BaseElementInstance,
): undefined | typeof BaseElementTemplate {
  return ConvertInstance2TemplateMap[instanceClass.name]
}

export function convertString2Template<T extends BaseElementTemplate>(
  templateClass: string,
): undefined | typeof BaseElementTemplate {
  return ConvertString2TemplateMap[templateClass as 'BaseElementTemplate']
}

export function convertString2Instance<T extends BaseElementTemplate>(
  instanceClass: string,
): undefined | typeof BaseElementInstance {
  return ConvertString2InstanceMap[instanceClass as 'BaseElementInstance']
}
