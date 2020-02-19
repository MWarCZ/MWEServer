import { BeforeInsert, Column, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm'
import { v4 as uuid } from 'uuid'

import { Json } from '../../types/json'
import { fillElement, OptionsConstructor } from './baseElement'
import { FlowElementInstance, FlowElementTemplate } from './flowElement'
import { ProcessInstance, ProcessTemplate } from './process'

@Entity()
export class DataObjectTemplate implements FlowElementTemplate {
  @PrimaryGeneratedColumn()
  id?: number

  @Column('text')
  bpmnId?: string

  @Column('varchar', { length: 255, default: '' })
  name?: string

  //=============

  @ManyToOne(
    type => ProcessTemplate,
    entity => entity.dataObjects,
    { onDelete: 'CASCADE' },
  )
  processTemplate?: ProcessTemplate

  @Column({ nullable: true })
  processTemplateId?: number

  //============

  @Column('boolean', { default: false })
  strict?: boolean

  @Column('simple-json')
  json: Json = {}

  @OneToMany(
    type => DataObjectInstance,
    entity => entity.template,
    { onDelete: 'CASCADE' },
  )
  instances?: DataObjectInstance[]

  constructor(options?: OptionsConstructor<DataObjectTemplate>) {
    fillElement(this, options)
  }

  @BeforeInsert()
  genBpmnId() {
    if (!this.bpmnId)
      this.bpmnId = uuid()
  }
}

@Entity()
export class DataObjectInstance implements FlowElementInstance {
  @PrimaryGeneratedColumn()
  id?: number

  @Column('datetime', { nullable: true })
  startDateTime?: Date

  @Column('datetime', { nullable: true })
  endDateTime?: Date

  //===============

  @ManyToOne(
    type => ProcessInstance,
    entity => entity.dataObjects,
    { onDelete: 'CASCADE' },
  )
  processInstance?: ProcessInstance

  @Column({ nullable: true })
  processInstanceId?: number

  @Column({ nullable: true })
  templateId?: number

  //===============

  @Column('simple-json')
  data: Json = {}

  @ManyToOne(
    type => DataObjectTemplate,
    entity => entity.instances,
    { onDelete: 'CASCADE' },
  )
  template?: DataObjectTemplate

  constructor(options?: OptionsConstructor<DataObjectInstance>) {
    fillElement(this, options)
  }
}
