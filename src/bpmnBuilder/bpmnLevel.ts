///////////////////////////////////////
// Soubor: src/bpmnBuilder/bpmnLevel.ts
// Projekt: MWEServer
// Autor: Miroslav Válka
///////////////////////////////////////
import {
  BaseElementTemplate,
  DataObjectTemplate,
  NodeElementTemplate,
  ProcessTemplate,
  SequenceFlowTemplate,
} from '../entity/bpmn'
import { BpmnFxm } from './bpmnFxm'

/**
 * Datove typy pro pouziti behem analyzy a prevodu dat
 * ze souboru BPMN do interni reprezentace v databazi.
 */
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
    refObject: { bpmnId: string, dataObjectRef: string, name: string },
  }
  type StartEvent = {
    entity: NodeElementTemplate, data: BpmnFxm.StartEvent, tag: 'startEvent',
  }
  type EndEvent = {
    entity: NodeElementTemplate, data: BpmnFxm.EndEvent, tag: 'endEvent',
  }
  type IntermediateThrowEvent = {
    entity: NodeElementTemplate, data: BpmnFxm.IntermediateThrowEvent, tag: 'intermediateThrowEvent',
  }
  type IntermediateCatchEvent = {
    entity: NodeElementTemplate, data: BpmnFxm.IntermediateCatchEvent, tag: 'intermediateCatchEvent',
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
    | IntermediateThrowEvent
    | IntermediateCatchEvent

  type NodeElement = Task
    | Gateway
    | ScriptTask
    | StartEvent
    | EndEvent
    | IntermediateThrowEvent
    | IntermediateCatchEvent

}
