import { Column, Entity, ManyToOne, OneToMany } from 'typeorm'

import { BaseElementInstance } from './baseElement'
import { FlowNodeTemplate } from './flowNodeTemplate'

@Entity()
export class DataObjectTemplate extends FlowNodeTemplate {

  @Column('boolean', { default: false })
  strict?: boolean

  @Column('simple-json')
  json?: any

  @OneToMany(type => DataObjectInstance, entity => entity.template)
  instances?: DataObjectInstance[]

}

@Entity()
export class DataObjectInstance extends BaseElementInstance {

  @Column('simple-json')
  data?: any

  @ManyToOne(type => DataObjectTemplate, entity => entity.instances)
  template?: DataObjectTemplate
}
