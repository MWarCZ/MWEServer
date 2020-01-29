import { Column, Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm'

import { BaseElementTemplate } from './baseElement'

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

  @OneToMany(type => ProcessVersionTemplate, version => version.processTemplate)
  versions?: ProcessVersionTemplate[]

}


@Entity()
export class ProcessVersionTemplate {
  @PrimaryGeneratedColumn()
  id?: number

  @Column('varchar', { length: 50, default: '1' })
  version?: string

  @Column('enum', {
    enum: VersionType,
    default: VersionType.number,
  })
  versionType?: VersionType

  @ManyToOne(type => ProcessTemplate, processTemplate => processTemplate.versions)
  processTemplate?: ProcessTemplate


  @OneToMany(type => ProcessInstance, processInstance => processInstance.processTemplate)
  processInstances?: ProcessInstance[]

}

@Entity()
export class ProcessInstance {
  @PrimaryGeneratedColumn()
  id?: number

  @ManyToOne(type => ProcessVersionTemplate, version => version.processInstances)
  processTemplate?: ProcessTemplate

}
