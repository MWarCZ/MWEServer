import { Entity, TableInheritance } from 'typeorm'

import { FlowElementTemplate } from './flowElement'

@Entity()
@TableInheritance({ column: { type: 'varchar', name: 'class' } })
export abstract class EventTemplate extends FlowElementTemplate {
  eventDefinition?: any
}

