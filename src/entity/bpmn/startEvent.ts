import { ChildEntity, Entity, JoinTable, ManyToMany, ManyToOne, OneToMany } from 'typeorm'

import { ConnectorNode2Sequence } from './connectorNodeAndSequence'
import { DataObjectTemplate } from './dataObject'
import { EventInstance, EventTemplate } from './event'
import { NodeOutgoing, NodeOutputs } from './flowElement'

@ChildEntity()
export class StartEventTemplate extends EventTemplate implements NodeOutgoing, NodeOutputs {

  @OneToMany(type => ConnectorNode2Sequence, entity => entity.event)
  outgoing?: ConnectorNode2Sequence[]

  @ManyToMany(type => DataObjectTemplate)
  @JoinTable()
  outputs?: DataObjectTemplate[]

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
