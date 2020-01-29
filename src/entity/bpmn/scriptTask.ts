import { ChildEntity, Column, Entity, ManyToOne, OneToMany } from 'typeorm'

import { TaskInstance, TaskTemplate } from './task'

// @Entity()
@ChildEntity()
export class ScriptTaskTemplate extends TaskTemplate {

  @Column('varchar', { default: 'js', nullable: false, length: 50 })
  scriptFormat?: string

  @Column('text')
  script?: string

  @OneToMany(type => ScriptTaskInstance, entity => entity.template)
  instances?: ScriptTaskInstance[]

}

@Entity()
export class ScriptTaskInstance extends TaskInstance {

  @ManyToOne(type => ScriptTaskTemplate, entity => entity.instances)
  template?: ScriptTaskTemplate
}
