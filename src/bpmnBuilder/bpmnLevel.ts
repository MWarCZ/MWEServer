import {
  BaseElementTemplate,
  DataObjectTemplate,
  NodeElementTemplate,
  ProcessTemplate,
  SequenceFlowTemplate,
} from '../entity/bpmn'
import { BpmnFxm } from './bpmnFxm'



// import { NodeToSequenceFlow, SequenceFlowToNode } from '../entity/bpmn/sequenceFlowToNode'
export declare namespace BpmnLevel {

  /** Parsovani BPMN Level 1 */
  type Process = {
    entity: ProcessTemplate, data: BpmnFxm.Process, tag: 'process',
  }
  type Colaboration = {
    entity: BaseElementTemplate, data: undefined, tag: 'colaboration',
  }
  type Level1 = Process | Colaboration

  /** Parsovani BPMN Level 2 */
  type Task = {
    entity: NodeElementTemplate, data: BpmnFxm.Task, tag: 'task',
  }
  type ScriptTask = {
    entity: NodeElementTemplate, data: BpmnFxm.ScriptTask, tag: 'scriptTask',
  }
  type SequenceFlow = {
    entity: SequenceFlowTemplate, data: BpmnFxm.SequenceFlow, tag: 'sequenceFlow',
  }
  type DataObject = {
    entity: DataObjectTemplate, data: BpmnFxm.DataObject, tag: 'dataObject',
  }
  type DataObjectReference = {
    entity: DataObjectTemplate | undefined, data: BpmnFxm.DataObjectReference, tag: 'dataObjectReference',
    refObject: { bpmnId: string, dataObjectRef: string },
  }
  type StartEvent = {
    entity: NodeElementTemplate, data: BpmnFxm.StartEvent, tag: 'startEvent',
  }
  type EndEvent = {
    entity: NodeElementTemplate, data: BpmnFxm.EndEvent, tag: 'endEvent',
  }
  type Gateway = {
    entity: NodeElementTemplate, data: BpmnFxm.Gateway, tag: 'gateway',
  }
  type Level2 = Task
    | SequenceFlow
    | DataObject
    | DataObjectReference
    | StartEvent
    | EndEvent

}
