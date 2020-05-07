import { compare, hash } from 'bcryptjs'
import { BeforeInsert, BeforeRemove, BeforeUpdate, Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm'

import { objectFiller, OptionsConstructor } from '../utils/objectFiller'
import { Member } from './member'

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id?: number

  @Column('varchar', { length: 100, unique: true})
  login?: string

  @Column('varchar', { length: 191})
  email: string = ''

  @Column('varchar', { length: 100 })
  firstName: string = ''

  @Column('varchar', { length: 100 })
  lastName: string = ''

  @Column('text')
  password: string = ''

  @Column('boolean', { default: false })
  protected: boolean = false

  @Column('boolean', { default: false })
  locked: boolean = false

  @Column('boolean', { default: false })
  removed: boolean = false

  // @ManyToMany(type => Group, group => group.users)
  // @JoinTable({ name: 'member'})
  // groups?: Group[]

  @OneToMany(type => Member, entity => entity.user, {
    onDelete: 'CASCADE',
  })
  membership?: Member[]

  @BeforeRemove()
  async canBeRemoved() {
    if (this.protected)
    throw new Error(`Uživatel '${this.login}' je chráněn. Není možné ho smazat.`)
  }

  @BeforeInsert()
  @BeforeUpdate()
  async hashPassword() {
    if (typeof this.password === 'string') {
      this.password = await hash(this.password, 13)
      // console.log(`Hash passwd for user ${this.login}`)
    }
  }
  @BeforeInsert()
  @BeforeUpdate()
  checkProtected() {
    if (this.protected && this.removed) {
      throw new Error(`Uživatel '${this.login}' je chráněn. Není možné ho odstranit.`)
    }
  }

  async comparePassword(password: string): Promise<boolean> {
    if (typeof this.password !== 'string')
      return false
    return compare(password, this.password)
  }

  constructor(options?: OptionsConstructor<User>) {
    objectFiller(this, options)
  }
}
