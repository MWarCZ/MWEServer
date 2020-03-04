import { BeforeRemove, Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm'

import { objectFiller, OptionsConstructor } from '../utils/objectFiller'
import { Member } from './member'

@Entity()
export class Group {
  @PrimaryGeneratedColumn()
  id?: number

  @Column('varchar', {length:255, unique: true})
  name?: string = ''

  @Column('boolean', {default: false})
  protected?: boolean = false

  @Column('boolean', { default: false })
  removed: boolean = false

  // @ManyToMany(type => User, user => user.groups)
  // users?: User[]

  @OneToMany(type => Member, entity => entity.group, {
    onDelete: 'CASCADE',
  })
  members?: Member[]

  @BeforeRemove()
  async canBeRemove() {
    if (this.protected)
      throw new Error(`Group '${this.name}' is protected. Impossible remove it.`)
  }

  constructor(options?: OptionsConstructor<Group>) {
    objectFiller(this, options)
  }
}

