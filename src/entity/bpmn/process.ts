import { Column, Entity, ManyToOne, OneToMany } from 'typeorm'

import { BaseElementInstance, BaseElementTemplate, fillElement, OptionsConstructor, ProcessStatus } from './baseElement'

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
export class ProcessTemplate extends BaseElementTemplate {

  @Column('boolean', { default: false, nullable: false })
  isExecutable?: boolean

  @Column('enum', {
    enum: ProcessType,
    default: ProcessType.None,
    nullable: false,
  })
  processType?: ProcessType

  @Column('varchar', {
    length: 50,
    default: '1',
    nullable: false,
  })
  version?: string

  @Column('enum', {
    enum: VersionType,
    default: VersionType.number,
    nullable: false,
  })
  versionType?: VersionType

  @OneToMany(
    type => ProcessInstance,
    processInstance => processInstance.processTemplate,
    { onDelete: 'CASCADE' },
  )
  processInstances?: ProcessInstance[]

  // @OneToMany(type => DataObjectTemplate, entity => entity.processTemplate)
  // dataObjects?: DataObjectTemplate[]

  // @OneToMany(type => NodeElementTemplate, entity => entity.processTemplate)
  // nodeElements?: NodeElementTemplate[]

  // @OneToMany(type => SequenceFlowTemplate, entity => entity.processTemplate)
  // sequenceFlows?: SequenceFlowTemplate[]

  constructor(options?: OptionsConstructor<ProcessTemplate>) {
    super()
    fillElement(this, options)
  }
}

@Entity()
export class ProcessInstance extends BaseElementInstance {

  @Column('enum', {
    enum: ProcessStatus,
    default: ProcessStatus.None,
    nullable: false,
  })
  status?: ProcessStatus

  @ManyToOne(
    type => ProcessTemplate,
    version => version.processInstances,
    { onDelete: 'CASCADE' },
  )
  processTemplate?: ProcessTemplate

  @Column({ nullable: true })
  processTemplateId?: number

  // @OneToMany(type => DataObjectInstance, entity => entity.processInstance)
  // dataObjects?: DataObjectInstance[]

  // @OneToMany(type => NodeElementInstance, entity => entity.processInstance)
  // nodeElements?: NodeElementInstance[]

  // @OneToMany(type => SequenceFlowInstance, entity => entity.processInstance)
  // sequenceFlows?: SequenceFlowInstance[]

}
