import { Column, Entity, ManyToOne, OneToMany, OneToOne } from 'typeorm'

import { BaseElementInstance, BaseElementTemplate } from './baseElement'
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
export class GatewayTemplate extends BaseElementTemplate {

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

  @OneToOne(type => SequenceFlowTemplate)
  default?: SequenceFlowTemplate


  @OneToMany(type => SequenceFlowToNode, entity => entity.gateway)
  incoming?: SequenceFlowToNode[]

  @OneToMany(type => NodeToSequenceFlow, entity => entity.gateway)
  outgoing?: NodeToSequenceFlow[]


  @OneToMany(type => GatewayInstance, entity => entity.template)
  instances?: GatewayInstance[]

}

@Entity()
export class GatewayInstance extends BaseElementInstance {

  @ManyToOne(type => GatewayTemplate, entity => entity.instances)
  template?: GatewayTemplate
}
