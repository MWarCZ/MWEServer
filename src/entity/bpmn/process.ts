import { Column, Entity, ManyToOne, OneToMany } from 'typeorm'

import { ActivityStatus, BaseElementInstance, BaseElementTemplate, OptionsBaseElement } from './baseElement'

export enum ProcessType {
  None = 'none',
  Public = 'public',
  Private = 'private',
}

export enum VersionType {
  number = 'number',
  semver = 'semver',
}

export interface OptionsProcess extends OptionsBaseElement {
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


  // @OneToMany(type => StartEventTemplate, event => event.processTemplate)
  // startEvent?: StartEventTemplate[]
  // @OneToMany(type => EndEventTemplate, event => event.processTemplate)
  // endEvent?: EndEventTemplate[]

  constructor(options?: Partial<OptionsProcess>) {
    super(options)
  }
}

@Entity()
export class ProcessInstance extends BaseElementInstance {

  @Column('enum', {
    enum: ActivityStatus,
    default: ActivityStatus.None,
    nullable: false,
  })
  status?: ActivityStatus

  @Column('datetime', { nullable: true })
  startDateTime?: Date

  @Column('datetime', { nullable: true })
  endDateTime?: Date

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
  // @OneToMany(type => StartEventInstance, entity => entity.processInstance)
  // startEvents?: StartEventInstance[]
  // @OneToMany(type => EndEventInstance, entity => entity.processInstance)
  // endEvents?: EndEventInstance[]


  // @OneToMany(type => GatewayInstance, entity => entity.processInstance)
  // gateways?: GatewayInstance[]

}
