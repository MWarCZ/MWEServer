///////////////////////////////////////
// Soubor: src/entity/bpmn/nodeElement.ts
// Projekt: MWEServer
// Autor: Miroslav Válka
///////////////////////////////////////
import { BeforeInsert, Column, Entity, JoinTable, ManyToMany, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm'
import { v4 as uuid } from 'uuid'

import { JsonMap } from '../../types/json'
import { objectFiller, OptionsConstructor } from '../../utils/objectFiller'
import { User } from '../user'
import { ActivityStatus } from './baseElement'
import { DataObjectTemplate } from './dataObject'
import { FlowElementInstance, FlowElementTemplate } from './flowElement'
import { ProcessInstance, ProcessTemplate } from './process'
import { SequenceFlowTemplate } from './sequenceFlow'

/**
 * Sablona uzlu.
 * Predstavuje elementy, ktere tvori strukturu sablony procesu.
 * Pro prirovnani k BPMN se jedna o ulohy, brany, udalosti.
 */
@Entity()
export class NodeElementTemplate implements FlowElementTemplate {
  @PrimaryGeneratedColumn()
  id?: number

  @Column('text')
  bpmnId?: string

  @Column('varchar', { length: 191, default: '' })
  name?: string

  // =============

  @ManyToOne(
    type => ProcessTemplate,
    entity => entity.nodeElements,
    { onDelete: 'CASCADE' },
  )
  processTemplate?: ProcessTemplate

  @Column({ nullable: true })
  processTemplateId?: number

  // ============

  // @Column('text')
  @Column('varchar', { default: '', nullable: false, length: 191 })
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

  // ==============

  @Column('varchar', { default: '', nullable: false, length: 191 })
  candidateAssignee: string = ''

  // ==============

  constructor(options?: OptionsConstructor<NodeElementTemplate>) {
    objectFiller(this, options)
  }

  @BeforeInsert()
  genBpmnId() {
    if (!this.bpmnId)
      this.bpmnId = uuid()
  }
}

/** Instance uzlu */
@Entity()
export class NodeElementInstance implements FlowElementInstance {
  @PrimaryGeneratedColumn()
  id?: number

  @Column('datetime', { nullable: true })
  startDateTime: Date = new Date()

  @Column('datetime', { nullable: true })
  endDateTime: Date | null = null

  // ===============

  @ManyToOne(
    type => ProcessInstance,
    entity => entity.nodeElements,
    { onDelete: 'CASCADE' },
  )
  processInstance?: ProcessInstance

  @Column({ nullable: true })
  processInstanceId?: number

  @Column({ nullable: true })
  templateId?: number

  // ===============

  @Column('enum', {
    enum: ActivityStatus,
    default: ActivityStatus.None,
    nullable: false,
  })
  status?: ActivityStatus

  @Column('simple-json')
  data: JsonMap = {}

  @Column('simple-json')
  returnValue: JsonMap = {}

  @ManyToOne(
    type => NodeElementTemplate,
    entity => entity.instances,
    { onDelete: 'CASCADE' },
  )
  template?: NodeElementTemplate

  // ==============

  // @Column('varchar', { default: '', nullable: false, length: 191 })
  // assignee: string = ''
  @ManyToOne(
    type => User,
    { nullable: true },
  )
  assignee: User | null = null

  @Column({ nullable: true })
  assigneeId?: number

  // ==============

  constructor(options?: OptionsConstructor<NodeElementInstance>) {
    objectFiller(this, options)
  }
}

