import { ChildEntity, Entity, ManyToOne, OneToMany } from 'typeorm'

import { BaseElementInstance } from './baseElement'
import { EventTemplate } from './event'
import { NodeToSequenceFlow } from './sequenceFlowToNode'

@ChildEntity()
export  class StartEventTemplate extends EventTemplate {

  @OneToMany(type => NodeToSequenceFlow, entity => entity.event)
  outgoing?: NodeToSequenceFlow[]

  @OneToMany(type => StartEventInstance, entity => entity.template)
  instances?: StartEventInstance[]
}

@Entity()
export class StartEventInstance extends BaseElementInstance {

  @ManyToOne(type => StartEventTemplate, entity => entity.instances)
  template?: StartEventTemplate
}
