import { Column, Entity, OneToMany } from 'typeorm'

import { BaseElementTemplate } from './baseElement'
import { FlowNodeTemplate } from './flowNodeTemplate'

/**
 * Propopoj mezi uzly BPMN. SequenceFlow2FlowNode
 */
@Entity()
export class SequenceFlowTemplate extends BaseElementTemplate {
  @OneToMany(type => FlowNodeTemplate, entity => entity.outgoing)
  source?: FlowNodeTemplate

  @OneToMany(type => FlowNodeTemplate, entity => entity.incoming)
  target?: FlowNodeTemplate

  @Column('text')
  expression?: string
}

