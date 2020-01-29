import { Column, Entity, ManyToOne, OneToMany } from 'typeorm'

import { BaseElementInstance, BaseElementTemplate } from './baseElement'

export enum ProcessType {
  None = 'none',
  Public = 'public',
  Private = 'private',
}

export enum VersionType {
  number = 'number',
  semver = 'semver',
}

@Entity()
export class ProcessTemplate extends BaseElementTemplate {

  @Column('boolean', { default: false })
  isExecutable?: boolean

  @Column('enum', {
    enum: ProcessType,
    default: ProcessType.None,
  })
  processType?: ProcessType

  @Column('varchar', { length: 50, default: '1' })
  version?: string

  @Column('enum', {
    enum: VersionType,
    default: VersionType.number,
  })
  versionType?: VersionType

  @OneToMany(type => ProcessInstance, processInstance => processInstance.processTemplate)
  processInstances?: ProcessInstance[]

}

@Entity()
export class ProcessInstance extends BaseElementInstance {

  @ManyToOne(type => ProcessTemplate, version => version.processInstances)
  processTemplate?: ProcessTemplate

}
