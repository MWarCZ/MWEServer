///////////////////////////////////////
// Soubor: src/entity/bpmn/flowElement.ts
// Projekt: MWEServer
// Autor: Miroslav Válka
///////////////////////////////////////
import { BaseElementInstance, BaseElementTemplate } from './baseElement'
import { ProcessInstance, ProcessTemplate } from './process'

export interface OptionsFlowElement {
  bpmnId: string,
  name: string,
}

/**
 * Zakladni entita obsahujici spolecne vlstnosti
 * pro vsechny dcerinne elementy sablony procesu BPMN.
 */
export interface FlowElementTemplate extends BaseElementTemplate {
  processTemplate?: ProcessTemplate
  processTemplateId?: number
  instances?: FlowElementInstance[]
}

/**
 * Zakladni entita obsahujici spolecne vlastnosti pro vsechny elementy instance BPMN.
 */
export interface FlowElementInstance extends BaseElementInstance {
  processInstance?: ProcessInstance
  processInstanceId?: number
  templateId?: number
  template?: FlowElementTemplate
}

