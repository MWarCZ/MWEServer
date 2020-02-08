import { ChildEntity, Entity, ManyToOne, OneToMany } from 'typeorm'

import { EventInstance, EventTemplate } from './event'
import { NodeToSequenceFlow } from './sequenceFlowToNode'

@ChildEntity()
export  class StartEventTemplate extends EventTemplate {

  @OneToMany(type => NodeToSequenceFlow, entity => entity.event)
  outgoing?: NodeToSequenceFlow[]

  @OneToMany(
    type => StartEventInstance,
    entity => entity.template,
    { onDelete: 'CASCADE' },
  )
  instances?: StartEventInstance[]
}

@Entity()
export class StartEventInstance extends EventInstance {

  @ManyToOne(
    type => StartEventTemplate,
    entity => entity.instances,
    { onDelete: 'CASCADE' },
  )
  template?: StartEventTemplate
}
