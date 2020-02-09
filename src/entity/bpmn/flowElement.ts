import { Column, ManyToOne } from 'typeorm'

import { ActivityStatus, BaseElementInstance, BaseElementTemplate } from './baseElement'
import { ProcessInstance, ProcessTemplate } from './process'


export interface OptionsFlowElement {
  bpmnId: string,
  name: string,
}

/**
 * Zakladni entita obsahujici spolecne vlstnosti
 * pro vsechny dcerinne elementy sablony procesu BPMN.
 */
export abstract class FlowElementTemplate extends BaseElementTemplate {

  abstract instances?: FlowElementInstance[]

  @ManyToOne(type => ProcessTemplate, { onDelete: 'CASCADE' })
  processTemplate?: ProcessTemplate

  @Column({ nullable: true })
  processTemplateId?: number

}

/**
 * Zakladni entita obsahujici spolecne vlastnosti pro vsechny elementy instance BPMN.
 */
export abstract class FlowElementInstance extends BaseElementInstance {

  abstract template?: FlowElementTemplate
  @Column({ nullable: true })
  templateId?: number

  @ManyToOne(type => ProcessInstance, { onDelete: 'CASCADE' })
  processInstance?: ProcessInstance

  @Column({ nullable: true })
  processInstanceId?: number

  @Column('enum', {
    enum: ActivityStatus,
    default: ActivityStatus.None,
    nullable: false,
  })
  status?: ActivityStatus
}

