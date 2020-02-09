import { Column, Entity, ManyToOne, OneToMany } from 'typeorm'

import { Json } from '../../types/json'
import { BaseElementInstance } from './baseElement'
import { FlowElementTemplate } from './flowElement'

@Entity()
export class DataObjectTemplate extends FlowElementTemplate {

  @Column('boolean', { default: false })
  strict?: boolean

  @Column('simple-json')
  json?: Json = {}

  @OneToMany(
    type => DataObjectInstance,
    entity => entity.template,
    { onDelete: 'CASCADE' },
  )
  instances?: DataObjectInstance[]

}

@Entity()
export class DataObjectInstance extends BaseElementInstance {

  @Column('simple-json')
  data?: Json

  @ManyToOne(
    type => DataObjectTemplate,
    entity => entity.instances,
    { onDelete: 'CASCADE' },
  )
  template?: DataObjectTemplate
}
