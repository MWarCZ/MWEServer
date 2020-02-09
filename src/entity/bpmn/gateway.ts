import { Column, Entity, JoinColumn, ManyToOne, OneToMany, OneToOne } from 'typeorm'

import { FlowElementInstance, FlowElementTemplate } from './flowElement'
import { SequenceFlowTemplate } from './sequenceFlow'
import { NodeToSequenceFlow, SequenceFlowToNode } from './sequenceFlowToNode'

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
export class GatewayTemplate extends FlowElementTemplate {

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


  @OneToMany(type => SequenceFlowToNode, entity => entity.gateway)
  incoming?: SequenceFlowToNode[]

  @OneToMany(type => NodeToSequenceFlow, entity => entity.gateway)
  outgoing?: NodeToSequenceFlow[]


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
