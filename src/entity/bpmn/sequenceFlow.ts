import { Column, Entity, OneToOne } from 'typeorm'

import { FlowElementTemplate } from './flowElement'
import { GatewayTemplate } from './gateway'
import { NodeToSequenceFlow, SequenceFlowToNode } from './sequenceFlowToNode'

/**
 * Propopoj mezi uzly BPMN. SequenceFlow2FlowNode
 */
@Entity()
export class SequenceFlowTemplate extends FlowElementTemplate {
  // @OneToMany(type => FlowNodeTemplate, entity => entity.outgoing)
  // source?: FlowNodeTemplate

  // @OneToMany(type => FlowNodeTemplate, entity => entity.incoming)
  // target?: FlowNodeTemplate

  @OneToOne(type => NodeToSequenceFlow, entity => entity.sequenceFlow, { cascade: true })
  source?: NodeToSequenceFlow

  @OneToOne(type => SequenceFlowToNode, entity => entity.sequenceFlow, { cascade: true })
  target?: SequenceFlowToNode

  @Column('text')
  expression?: string = ''

  @OneToOne(type => GatewayTemplate, entity => entity.default, { cascade: true })
  default?: GatewayTemplate

  instances: undefined
}

