import { Column, Entity, OneToOne } from 'typeorm'

import { BaseElementTemplate } from './baseElement'
import { NodeToSequenceFlow, SequenceFlowToNode } from './sequenceFlowToNode'

/**
 * Propopoj mezi uzly BPMN. SequenceFlow2FlowNode
 */
@Entity()
export class SequenceFlowTemplate extends BaseElementTemplate {
  // @OneToMany(type => FlowNodeTemplate, entity => entity.outgoing)
  // source?: FlowNodeTemplate

  // @OneToMany(type => FlowNodeTemplate, entity => entity.incoming)
  // target?: FlowNodeTemplate

  @OneToOne(type => NodeToSequenceFlow, entity => entity.sequenceFlow)
  source?: NodeToSequenceFlow

  @OneToOne(type => SequenceFlowToNode, entity => entity.sequenceFlow)
  target?: SequenceFlowToNode

  @Column('text')
  expression?: string = ''
}

