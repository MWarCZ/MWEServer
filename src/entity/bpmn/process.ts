import { BeforeInsert, Column, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm'
import { v4 as uuid } from 'uuid'

import { JsonMap } from '../../types/json'
import { objectFiller, OptionsConstructor } from '../../utils/objectFiller'
import { BaseElementInstance, BaseElementTemplate, ProcessStatus } from './baseElement'
import { DataObjectInstance, DataObjectTemplate } from './dataObject'
import { NodeElementInstance, NodeElementTemplate } from './nodeElement'
import { SequenceFlowInstance, SequenceFlowTemplate } from './sequenceFlow'

export enum ProcessType {
  None = 'none',
  Public = 'public',
  Private = 'private',
}

export enum VersionType {
  number = 'number',
  semver = 'semver',
}

export interface OptionsProcess {
  isExecutable: boolean,
  processType: ProcessType,
  versionType: VersionType,
  version: string,
}

@Entity()
export class ProcessTemplate implements BaseElementTemplate {
  @PrimaryGeneratedColumn()
  id?: number

  @Column('text')
  bpmnId?: string

  @Column('varchar', { length: 255, default: '' })
  name: string = ''

  // ===================

  @Column('boolean', { default: true, nullable: false })
  isExecutable: boolean = true

  @Column('enum', {
    enum: ProcessType,
    default: ProcessType.None,
    nullable: false,
  })
  processType: ProcessType = ProcessType.None

  @Column('varchar', {
    length: 50,
    default: '1',
    nullable: false,
  })
  version: string = '1'

  @Column('enum', {
    enum: VersionType,
    default: VersionType.number,
    nullable: false,
  })
  versionType: VersionType = VersionType.number

  @OneToMany(
    type => ProcessInstance,
    processInstance => processInstance.processTemplate,
    { onDelete: 'CASCADE' },
  )
  processInstances?: ProcessInstance[]

  @OneToMany(type => DataObjectTemplate, entity => entity.processTemplate)
  dataObjects?: DataObjectTemplate[]

  @OneToMany(type => NodeElementTemplate, entity => entity.processTemplate)
  nodeElements?: NodeElementTemplate[]

  @OneToMany(type => SequenceFlowTemplate, entity => entity.processTemplate)
  sequenceFlows?: SequenceFlowTemplate[]

  constructor(options?: OptionsConstructor<ProcessTemplate>) {
    objectFiller(this, options)
  }

  @BeforeInsert()
  genBpmnId() {
    if (!this.bpmnId)
      this.bpmnId = uuid()
  }
}

@Entity()
export class ProcessInstance implements BaseElementInstance {
  @PrimaryGeneratedColumn()
  id?: number

  @Column('datetime', { nullable: true })
  startDateTime: Date = new Date()

  @Column('datetime', { nullable: true })
  endDateTime: Date | null = null

  // ===============


  @Column('simple-json')
  data: JsonMap = {}

  @Column('enum', {
    enum: ProcessStatus,
    default: ProcessStatus.None,
    nullable: false,
  })
  status: ProcessStatus = ProcessStatus.None

  @ManyToOne(
    type => ProcessTemplate,
    version => version.processInstances,
    { onDelete: 'CASCADE' },
  )
  processTemplate?: ProcessTemplate

  @Column({ nullable: true })
  processTemplateId?: number

  @OneToMany(type => DataObjectInstance, entity => entity.processInstance)
  dataObjects?: DataObjectInstance[]

  @OneToMany(type => NodeElementInstance, entity => entity.processInstance)
  nodeElements?: NodeElementInstance[]

  @OneToMany(type => SequenceFlowInstance, entity => entity.processInstance)
  sequenceFlows?: SequenceFlowInstance[]

  constructor(options?: OptionsConstructor<ProcessInstance>) {
    objectFiller(this, options)
  }
}
