import { Column, Entity, JoinColumn, ManyToOne, OneToMany, OneToOne } from 'typeorm'

import { ConnectorNode2Sequence, ConnectorSequence2Node } from './connectorNodeAndSequence'
import { FlowElementInstance, FlowElementTemplate, NodeIncoming, NodeOutgoing } from './flowElement'
import { SequenceFlowTemplate } from './sequenceFlow'



export enum GatewayType {
  Exclusive = 'exclusive',
  Inclusive = 'inclusive',
  Parallel = 'parallel',
}
export enum GatewayDirection {
  Unspecified = 'unspecified',
  Converging = 'converging',
  Diverging = 'diverging',
  Mixed = 'mixed',
}

@Entity()
export class GatewayTemplate extends FlowElementTemplate implements NodeOutgoing, NodeIncoming {

  @Column('enum', {
    enum: GatewayType,
    default: GatewayType.Exclusive,
    nullable: false,
  })
  type?: GatewayType

  @Column('enum', {
    enum: GatewayDirection,
    default: GatewayDirection.Unspecified,
  })
  direction?: GatewayDirection

  @OneToOne(type => SequenceFlowTemplate, {
    onDelete: 'CASCADE',
  })
  @JoinColumn()
  default?: SequenceFlowTemplate


  @OneToMany(type => ConnectorSequence2Node, entity => entity.gateway)
  incoming?: ConnectorSequence2Node[]

  @OneToMany(type => ConnectorNode2Sequence, entity => entity.gateway)
  outgoing?: ConnectorNode2Sequence[]


  @OneToMany(
    type => GatewayInstance,
    entity => entity.template,
    { onDelete: 'CASCADE' },
  )
  instances?: GatewayInstance[]

}

@Entity()
export class GatewayInstance extends FlowElementInstance {

  @ManyToOne(
    type => GatewayTemplate,
    entity => entity.instances,
    { onDelete: 'CASCADE' },
  )
  template?: GatewayTemplate
}
