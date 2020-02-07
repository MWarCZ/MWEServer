import { ChildEntity, Entity, ManyToOne, OneToMany } from 'typeorm'

import { BasicTaskInstance, BasicTaskTemplate } from './basicTask'

@ChildEntity()
export class TaskTemplate extends BasicTaskTemplate {

  @OneToMany(type => TaskInstance, entity => entity.template)
  instances?: TaskInstance[]

}

@Entity()
export class TaskInstance extends BasicTaskInstance {

  @ManyToOne(type => TaskTemplate, entity => entity.instances)
  template?: TaskTemplate
}


