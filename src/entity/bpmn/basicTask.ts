import { Column, Entity, JoinTable, ManyToMany, ManyToOne, OneToMany, TableInheritance } from 'typeorm'

import { DataObjectTemplate } from './dataObject'
import { FlowElementInstance, FlowElementTemplate } from './flowElement'
import { NodeToSequenceFlow, SequenceFlowToNode } from './sequenceFlowToNode'

@Entity()
@TableInheritance({ column: { type: 'varchar', name: 'class' } })
export class BasicTaskTemplate extends FlowElementTemplate {

  // @Column('text')
  @Column('varchar', { default: '', nullable: false, length: 150 })
  implementation?: string

  @ManyToMany(type => DataObjectTemplate)
  @JoinTable()
  inputs?: DataObjectTemplate[]

  @ManyToMany(type => DataObjectTemplate)
  @JoinTable()
  outputs?: DataObjectTemplate[]


  @OneToMany(type => SequenceFlowToNode, entity => entity.task, { cascade: true })
  incoming?: SequenceFlowToNode[]

  @OneToMany(type => NodeToSequenceFlow, entity => entity.task)
  outgoing?: NodeToSequenceFlow[]


  @OneToMany(type => BasicTaskInstance, entity => entity.template)
  instances?: BasicTaskInstance[]

}

@Entity()
export class BasicTaskInstance extends FlowElementInstance {
  @Column('simple-json')
  returnValue?: any

  @ManyToOne(type => BasicTaskTemplate, entity => entity.instances)
  template?: BasicTaskTemplate
}


