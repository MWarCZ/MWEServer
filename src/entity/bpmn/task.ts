import { Column, Entity, JoinTable, ManyToMany, ManyToOne, OneToMany, TableInheritance } from 'typeorm'

import { ActivityStatus, BaseElementInstance } from './baseElement'
import { DataObjectTemplate } from './dataObject'
import { FlowElementTemplate } from './flowElement'
import { NodeToSequenceFlow, SequenceFlowToNode } from './sequenceFlowToNode'

@Entity()
@TableInheritance({ column: { type: 'varchar', name: 'class' } })
export class TaskTemplate extends FlowElementTemplate {

  @ManyToMany(type => DataObjectTemplate)
  @JoinTable()
  inputs?: DataObjectTemplate[]

  @ManyToMany(type => DataObjectTemplate)
  @JoinTable()
  outputs?: DataObjectTemplate[]


  @OneToMany(type => SequenceFlowToNode, entity => entity.task)
  incoming?: SequenceFlowToNode[]

  @OneToMany(type => NodeToSequenceFlow, entity => entity.task)
  outgoing?: NodeToSequenceFlow[]


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


