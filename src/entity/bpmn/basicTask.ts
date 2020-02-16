import { Column, Entity, JoinTable, ManyToMany, ManyToOne, OneToMany, TableInheritance } from 'typeorm'

import { Json } from '../../types/json'
import { ConnectorNode2Sequence, ConnectorSequence2Node } from './connectorNodeAndSequence'
import { DataObjectTemplate } from './dataObject'
import { FlowElementInstance, FlowElementTemplate, NodeIncoming, NodeInputs, NodeOutgoing, NodeOutputs } from './flowElement'

@Entity()
@TableInheritance({ column: { type: 'varchar', name: 'class' } })
export class BasicTaskTemplate extends FlowElementTemplate implements NodeIncoming, NodeOutgoing, NodeInputs, NodeOutputs {

  @Column()
  class!: string

  // @Column('text')
  @Column('varchar', { default: '', nullable: false, length: 150 })
  implementation?: string

  @ManyToMany(type => DataObjectTemplate)
  @JoinTable()
  inputs?: DataObjectTemplate[]

  @ManyToMany(type => DataObjectTemplate)
  @JoinTable()
  outputs?: DataObjectTemplate[]

  @OneToMany(type => ConnectorSequence2Node, entity => entity.task)
  incoming?: ConnectorSequence2Node[]

  @OneToMany(type => ConnectorNode2Sequence, entity => entity.task)
  outgoing?: ConnectorNode2Sequence[]

  /* TODO Nejspise odstranit  */
  // @OneToMany(type => BasicTaskInstance, entity => entity.template)
  instances?: BasicTaskInstance[]

}

// @Entity()
export abstract class BasicTaskInstance extends FlowElementInstance {
  @Column('simple-json')
  returnValue: Json = false

  /* TODO Nejspise odstranit  */
  @ManyToOne(type => BasicTaskTemplate, entity => entity.instances)
  template?: BasicTaskTemplate
}


