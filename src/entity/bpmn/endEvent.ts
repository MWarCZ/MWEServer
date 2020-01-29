import { ChildEntity, Entity, ManyToOne, OneToMany } from 'typeorm'

import { BaseElementInstance } from './baseElement'
import { EventTemplate } from './event'
import { SequenceFlowToNode } from './sequenceFlowToNode'

@ChildEntity()
export  class EndEventTemplate extends EventTemplate {

  @OneToMany(type => SequenceFlowToNode, entity => entity.event)
  incoming?: SequenceFlowToNode[]

  @OneToMany(type => EndEventInstance, entity => entity.template)
  instances?: EndEventInstance[]
}

@Entity()
export class EndEventInstance extends BaseElementInstance {

  @ManyToOne(type => EndEventTemplate, entity => entity.instances)
  template?: EndEventTemplate
}
