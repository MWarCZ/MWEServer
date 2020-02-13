import { Column, Entity, ManyToOne, OneToMany, OneToOne } from 'typeorm'

import { ConnectorNode2Sequence, ConnectorSequence2Node } from './connectorNodeAndSequence'
import { FlowElementInstance, FlowElementTemplate } from './flowElement'
import { GatewayTemplate } from './gateway'

/**
 * Propopoj mezi uzly BPMN. SequenceFlow2FlowNode
 */
@Entity()
export class SequenceFlowTemplate extends FlowElementTemplate {

  @Column('text')
  expression?: string = ''

  @OneToOne(
    type => ConnectorNode2Sequence,
    entity => entity.sequenceFlow,
    { cascade: true },
  )
  source?: ConnectorNode2Sequence

  @OneToOne(
    type => ConnectorSequence2Node,
    entity => entity.sequenceFlow,
    { cascade: true },
  )
  target?: ConnectorSequence2Node

  @OneToOne(
    type => GatewayTemplate,
    entity => entity.default,
    { cascade: true },
  )
  default?: GatewayTemplate

  @OneToMany(
    type => SequenceFlowInstance,
    entity => entity.template,
    { onDelete: 'CASCADE' },
  )
  instances?: SequenceFlowInstance[]
  // instances: undefined
}

@Entity()
export class SequenceFlowInstance extends FlowElementInstance {
  @ManyToOne(
    type => SequenceFlowTemplate,
    entity => entity.instances,
    { onDelete: 'CASCADE' },
  )
  template?: SequenceFlowTemplate
}

