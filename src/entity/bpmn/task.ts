import { ChildEntity, Column, Entity, JoinTable, ManyToMany, ManyToOne, OneToMany } from 'typeorm'

import { ActivityStatus, BaseElementInstance } from './baseElement'
import { DataObjectTemplate } from './dataObject'
import { FlowNodeTemplate } from './flowNodeTemplate'

// @Entity()
@ChildEntity()
export class TaskTemplate extends FlowNodeTemplate {

  @ManyToMany(type => DataObjectTemplate)
  @JoinTable()
  inputs?: DataObjectTemplate[]

  @ManyToMany(type => DataObjectTemplate)
  @JoinTable()
  outputs?: DataObjectTemplate[]

  @OneToMany(type => TaskInstance, entity => entity.template)
  instances?: TaskInstance[]

}

@Entity()
export class TaskInstance extends BaseElementInstance {

  @Column('enum', {
    enum: ActivityStatus,
    default: ActivityStatus.None,
    nullable: false,
  })
  status?: ActivityStatus

  @Column('simple-json')
  returnValue?: any

  @ManyToOne(type => TaskTemplate, entity => entity.instances)
  template?: TaskTemplate
}


