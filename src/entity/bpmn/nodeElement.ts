import { Column, Entity, JoinTable, ManyToMany, ManyToOne, OneToMany } from 'typeorm'

import { Json, JsonMap } from '../../types/json'
import { ActivityStatus, fillElement, OptionsConstructor } from './baseElement'
import { DataObjectTemplate } from './dataObject'
import { FlowElementInstance, FlowElementTemplate } from './flowElement'
import { SequenceFlowTemplate } from './sequenceFlow'

/**
 * Propopoj mezi uzly BPMN. SequenceFlow2FlowNode
 */
@Entity()
export class NodeElementTemplate extends FlowElementTemplate {

  // @Column('text')
  @Column('varchar', { default: '', nullable: false, length: 200 })
  implementation?: string

  @Column('simple-json')
  data: JsonMap = {}

  @ManyToMany(type => DataObjectTemplate)
  @JoinTable()
  inputs?: DataObjectTemplate[]

  @ManyToMany(type => DataObjectTemplate)
  @JoinTable()
  outputs?: DataObjectTemplate[]

  @OneToMany(type => SequenceFlowTemplate, entity => entity.target)
  incoming?: SequenceFlowTemplate[]

  @OneToMany(type => SequenceFlowTemplate, entity => entity.source)
  outgoing?: SequenceFlowTemplate[]

  @OneToMany(
    type => NodeElementInstance,
    entity => entity.template,
    { onDelete: 'CASCADE' },
  )
  instances?: NodeElementInstance[]

  constructor(options?: OptionsConstructor<NodeElementTemplate>) {
    super()
    fillElement(this, options)
  }
}

@Entity()
export class NodeElementInstance extends FlowElementInstance {

  @Column('enum', {
    enum: ActivityStatus,
    default: ActivityStatus.None,
    nullable: false,
  })
  status?: ActivityStatus

  @Column('simple-json')
  returnValue: Json = false

  @ManyToOne(
    type => NodeElementTemplate,
    entity => entity.instances,
    { onDelete: 'CASCADE' },
  )
  template?: NodeElementTemplate

  constructor(options?: OptionsConstructor<NodeElementInstance>) {
    super()
    fillElement(this, options)
  }
}

