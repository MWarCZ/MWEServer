import { ChildEntity, Column, Entity, ManyToOne, OneToMany } from 'typeorm'

import { BasicTaskInstance, BasicTaskTemplate } from './basicTask'

@ChildEntity()
export class ScriptTaskTemplate extends BasicTaskTemplate {

  @Column('varchar', { default: 'js', nullable: false, length: 50 })
  scriptFormat?: string

  @Column('text')
  script?: string

  @OneToMany(type => ScriptTaskInstance, entity => entity.template)
  instances?: ScriptTaskInstance[]

}

@Entity()
export class ScriptTaskInstance extends BasicTaskInstance {

  @ManyToOne(type => ScriptTaskTemplate, entity => entity.instances)
  template?: ScriptTaskTemplate
}
