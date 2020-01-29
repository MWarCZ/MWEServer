import { BeforeRemove, Column, Entity, ManyToMany, PrimaryGeneratedColumn } from 'typeorm'

import { User } from './user'

@Entity()
export class Group {
  @PrimaryGeneratedColumn()
  id?: number

  @Column('varchar', {length:255, unique: true})
  name?: string

  @ManyToMany(type => User, user => user.groups)
  users?: User[]

  @Column('boolean', {default: false})
  protected?: boolean

  @BeforeRemove()
  async canBeRemove() {
    if (this.protected)
      throw new Error(`Group '${this.name}' is protected. Impossible remove it.`)
  }
}

