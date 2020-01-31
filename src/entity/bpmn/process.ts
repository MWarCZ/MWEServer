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

  @OneToMany(type => ProcessInstance, processInstance => processInstance.processTemplate)
  processInstances?: ProcessInstance[]

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

  @ManyToOne(type => ProcessTemplate, version => version.processInstances)
  processTemplate?: ProcessTemplate

}
