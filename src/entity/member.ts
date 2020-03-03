import { BeforeRemove, Column, Entity, ManyToOne, PrimaryColumn } from 'typeorm'

import { Group } from './group'
import { User } from './user'

@Entity({ name: 'member' })
export class Member {
  @PrimaryColumn()
  userId?: number

  @ManyToOne(type => User, {
    onDelete: 'CASCADE',
  })
  user?: User

  @PrimaryColumn()
  groupId?: number

  @ManyToOne(type => Group, {
    onDelete: 'CASCADE',
  })
  group?: Group

  @Column('boolean', { default: false })
  protected: boolean = false

  @Column('boolean', { default: false })
  addMember: boolean = false

  @Column('boolean', { default: false })
  removeMember: boolean = false

  @Column('boolean', { default: false })
  showMembers: boolean = false

  @BeforeRemove()
  async canBeRemove() {
    if (this.protected)
      throw new Error(`Member '${this.userId}' inside '${this.groupId}' is protected. Impossible remove it.`)
  }
}
