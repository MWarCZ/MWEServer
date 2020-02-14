import { ChildEntity, Entity, JoinTable, ManyToMany, ManyToOne, OneToMany } from 'typeorm'

import { ConnectorSequence2Node } from './connectorNodeAndSequence'
import { DataObjectTemplate } from './dataObject'
import { EventInstance, EventTemplate } from './event'
import { NodeIncoming, NodeInputs } from './flowElement'

@ChildEntity()
export class EndEventTemplate extends EventTemplate implements NodeIncoming, NodeInputs {

  @OneToMany(type => ConnectorSequence2Node, entity => entity.event)
  incoming?: ConnectorSequence2Node[]

  @ManyToMany(type => DataObjectTemplate)
  @JoinTable()
  inputs?: DataObjectTemplate[]

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
