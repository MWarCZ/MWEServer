import { Column, Entity, ManyToOne, OneToMany } from 'typeorm'

import { Json } from '../../types/json'
import { BaseElementInstance, BaseElementTemplate } from './baseElement'

@Entity()
export class DataObjectTemplate extends BaseElementTemplate {

  @Column('boolean', { default: false })
  strict?: boolean

  @Column('simple-json')
  json?: Json = {}

  @OneToMany(type => DataObjectInstance, entity => entity.template)
  instances?: DataObjectInstance[]

}

@Entity()
export class DataObjectInstance extends BaseElementInstance {

  @Column('simple-json')
  data?: Json

  @ManyToOne(type => DataObjectTemplate, entity => entity.instances)
  template?: DataObjectTemplate
}
