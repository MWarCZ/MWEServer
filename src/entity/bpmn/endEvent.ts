import { ChildEntity, Entity, ManyToOne, OneToMany } from 'typeorm'

import { EventInstance, EventTemplate } from './event'
import { SequenceFlowToNode } from './sequenceFlowToNode'

@ChildEntity()
export  class EndEventTemplate extends EventTemplate {

  @OneToMany(type => SequenceFlowToNode, entity => entity.event)
  incoming?: SequenceFlowToNode[]

  @OneToMany(
    type => EndEventInstance,
    entity => entity.template,
    { onDelete: 'CASCADE' },
  )
  instances?: EndEventInstance[]
}

@Entity()
export class EndEventInstance extends EventInstance {

  @ManyToOne(
    type => EndEventTemplate,
    entity => entity.instances,
    { onDelete: 'CASCADE' },
  )
  template?: EndEventTemplate
}
