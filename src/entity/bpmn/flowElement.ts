import { ManyToOne } from 'typeorm'

import { BaseElementTemplate } from './baseElement'
import { ProcessTemplate } from './process'


export interface OptionsFlowElement {
  bpmnId: string,
  name: string,
}

/**
 * Zakladni entita obsahujici spolecne vlstnosti
 * pro vsechny dcerinne elementy sablony procesu BPMN.
 */
export abstract class FlowElementTemplate extends BaseElementTemplate {
  @ManyToOne(type => ProcessTemplate, {onDelete: 'CASCADE'})
  processTemplate?: ProcessTemplate
}

