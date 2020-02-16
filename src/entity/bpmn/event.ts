import { Column, Entity, TableInheritance } from 'typeorm'

import { FlowElementInstance, FlowElementTemplate } from './flowElement'

@Entity()
@TableInheritance({ column: { type: 'varchar', name: 'class' } })
export abstract class EventTemplate extends FlowElementTemplate {

  @Column()
  class!: string

  eventDefinition?: any
  // @OneToMany(type => EventInstance, entity => entity.template)
  abstract instances?: EventInstance[]
}


export abstract class EventInstance extends FlowElementInstance {
  // @ManyToOne(type => EventTemplate, entity => entity.instances)
  abstract template?: EventTemplate
}

