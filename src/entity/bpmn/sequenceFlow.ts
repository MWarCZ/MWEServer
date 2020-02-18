import { Column, Entity, ManyToOne, OneToMany } from 'typeorm'

import { fillElement, OptionsConstructor } from './baseElement'
import { FlowElementInstance, FlowElementTemplate } from './flowElement'
import { NodeElementTemplate } from './nodeElement'

/**
 * Propopoj mezi uzly BPMN. SequenceFlow2FlowNode
 */
@Entity()
export class SequenceFlowTemplate extends FlowElementTemplate {

  @Column('text')
  expression: string = ''

  @Column()
  flag: string = ''

  @ManyToOne(
    type => NodeElementTemplate,
    entity => entity.outgoing,
    { cascade: true },
  )
  source?: NodeElementTemplate

  @ManyToOne(
    type => NodeElementTemplate,
    entity => entity.incoming,
    { cascade: true },
  )
  target?: NodeElementTemplate

  @OneToMany(
    type => SequenceFlowInstance,
    entity => entity.template,
    { onDelete: 'CASCADE' },
  )
  instances?: SequenceFlowInstance[]

  constructor(options?: OptionsConstructor<SequenceFlowTemplate>) {
    super()
    fillElement(this, options)
  }
}

@Entity()
export class SequenceFlowInstance extends FlowElementInstance {

  @ManyToOne(
    type => SequenceFlowTemplate,
    entity => entity.instances,
    { onDelete: 'CASCADE' },
  )
  template?: SequenceFlowTemplate

  constructor(options?: OptionsConstructor<SequenceFlowInstance>) {
    super()
    fillElement(this, options)
  }
}

