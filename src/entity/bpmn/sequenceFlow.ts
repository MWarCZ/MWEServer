import { BeforeInsert, Column, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm'
import { v4 as uuid } from 'uuid'

import { objectFiller, OptionsConstructor } from '../../utils/objectFiller'
import { FlowElementInstance, FlowElementTemplate } from './flowElement'
import { NodeElementInstance, NodeElementTemplate } from './nodeElement'
import { ProcessInstance, ProcessTemplate } from './process'

/**
 * Propopoj mezi uzly BPMN. SequenceFlow2FlowNode
 */
@Entity()
export class SequenceFlowTemplate implements FlowElementTemplate {
  @PrimaryGeneratedColumn()
  id?: number

  @Column('text')
  bpmnId?: string

  @Column('varchar', { length: 255, default: '' })
  name?: string

  // =============

  @ManyToOne(
    type => ProcessTemplate,
    entity => entity.sequenceFlows,
    { onDelete: 'CASCADE' },
  )
  processTemplate?: ProcessTemplate

  @Column({ nullable: true })
  processTemplateId?: number

  // ============

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

  @Column({ nullable: true })
  sourceId?: number

  @ManyToOne(
    type => NodeElementTemplate,
    entity => entity.incoming,
    { cascade: true },
  )
  target?: NodeElementTemplate

  @Column({ nullable: true })
  targetId?: number

  @OneToMany(
    type => SequenceFlowInstance,
    entity => entity.template,
    { onDelete: 'CASCADE' },
  )
  instances?: SequenceFlowInstance[]

  constructor(options?: OptionsConstructor<SequenceFlowTemplate>) {
    objectFiller(this, options)
  }

  @BeforeInsert()
  genBpmnId() {
    if (!this.bpmnId)
      this.bpmnId = uuid()
  }
}

@Entity()
export class SequenceFlowInstance implements FlowElementInstance {

  @PrimaryGeneratedColumn()
  id?: number

  @Column('datetime', { nullable: true })
  startDateTime?: Date

  @Column('datetime', { nullable: true })
  endDateTime?: Date

  // ===============

  @ManyToOne(
    type => ProcessInstance,
    entity => entity.sequenceFlows,
    { onDelete: 'CASCADE' },
  )
  processInstance?: ProcessInstance

  @Column({ nullable: true })
  processInstanceId?: number

  @Column({ nullable: true })
  templateId?: number

  // ===============

  @ManyToOne(
    type => NodeElementInstance,
    { onDelete: 'CASCADE' },
  )
  source?: NodeElementInstance

  @Column({ nullable: true })
  sourceId?: number

  @ManyToOne(
    type => NodeElementInstance,
    { onDelete: 'CASCADE' },
  )
  target?: NodeElementInstance

  @Column({ nullable: true })
  targetId?: number

  @ManyToOne(
    type => SequenceFlowTemplate,
    entity => entity.instances,
    { onDelete: 'CASCADE' },
  )
  template?: SequenceFlowTemplate

  constructor(options?: OptionsConstructor<SequenceFlowInstance>) {
    objectFiller(this, options)
  }
}

