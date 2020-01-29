import { Entity, TableInheritance } from 'typeorm'

import { BaseElementTemplate } from './baseElement'

@Entity()
@TableInheritance({ column: { type: "varchar", name: "class" } })
export abstract class EventTemplate extends BaseElementTemplate {
  eventDefinition?: any
}

