import { ChildEntity, Entity, ManyToOne, OneToMany } from 'typeorm'

import { TaskInstance, TaskTemplate } from './task'

// @Entity()
@ChildEntity()
export class ServiceTaskTemplate extends TaskTemplate {

  @OneToMany(type => ServiceTaskInstance, entity => entity.template)
  instances?: ServiceTaskInstance[]

}

@Entity()
export class ServiceTaskInstance extends TaskInstance {

  @ManyToOne(type => ServiceTaskTemplate, entity => entity.instances)
  template?: ServiceTaskTemplate
}
