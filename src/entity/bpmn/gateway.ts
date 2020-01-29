import { ChildEntity, Column, Entity, ManyToOne, OneToMany, OneToOne } from 'typeorm'

import { BaseElementInstance } from './baseElement'
import { FlowNodeTemplate } from './flowNodeTemplate'
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

// @Entity()
@ChildEntity()
export class GatewayTemplate extends FlowNodeTemplate {

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

  @OneToMany(type => GatewayInstance, entity => entity.template)
  instances?: GatewayInstance[]

}

@Entity()
export class GatewayInstance extends BaseElementInstance {

  @ManyToOne(type => GatewayTemplate, entity => entity.instances)
  template?: GatewayTemplate
}
