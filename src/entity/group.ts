import { BeforeRemove, Column, Entity, ManyToMany, OneToMany, PrimaryGeneratedColumn } from 'typeorm'

import { Member } from './member'
import { User } from './user'

@Entity()
export class Group {
  @PrimaryGeneratedColumn()
  id?: number

  @Column('varchar', {length:255, unique: true})
  name?: string = ''

  @Column('boolean', {default: false})
  protected?: boolean = false

  @ManyToMany(type => User, user => user.groups)
  users?: User[]

  @OneToMany(type=> Member, entity=>entity.group )
  members?: Member[]

  @BeforeRemove()
  async canBeRemove() {
    if (this.protected)
      throw new Error(`Group '${this.name}' is protected. Impossible remove it.`)
  }
}

