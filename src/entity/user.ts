import { compare, hash } from 'bcryptjs'
import {
  BeforeInsert,
  BeforeRemove,
  BeforeUpdate,
  Column,
  Entity,
  JoinTable,
  ManyToMany,
  PrimaryGeneratedColumn,
} from 'typeorm'

import { Group } from './group'

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id?: number

  @Column('varchar', { length: 100, unique: true})
  login?: string

  @Column('varchar', { length: 255})
  email?: string

  @Column('varchar', { length: 100 })
  firstName?: string

  @Column('varchar', { length: 100 })
  lastName?: string

  @Column('text')
  password?: string

  @ManyToMany(type => Group, group => group.users, {eager: true})
  @JoinTable()
  groups?: Group[]

  @Column('boolean', { default: false })
  protected?: boolean

  @Column('boolean', { default: false })
  locked?: boolean

  @BeforeRemove()
  async canBeRemoved() {
    if (this.protected)
      throw new Error(`User '${this.login}' is protected. Impossible remove it.`)
  }

  @BeforeInsert()
  @BeforeUpdate()
  async hashPassword() {
    if (typeof this.password === 'string') {
      this.password = await hash(this.password, 13)
      // console.log(`Hash passwd for user ${this.login}`)
    }
  }

  async comparePassword(password: string): Promise<boolean> {
    if (typeof this.password !== 'string')
      return false
    return compare(password, this.password)
  }
}

