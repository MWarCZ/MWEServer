import { Connection, FindConditions } from 'typeorm'

import { Member, User } from '../entity'
import { ContextUser } from '../graphql/context'
import { OneOf } from '../utils/OneOf'
import { ProtectedGroups } from './helpers'

export function UserOneOf(args: {
  groupNames: string[],
  isSuperUserAdmin?: Function,
  isUserAdmin?: Function,
  isOther?: Function,
}) {
  return OneOf(
    [args.groupNames.includes(ProtectedGroups.SuperUserAdmin), args.isSuperUserAdmin],
    [args.groupNames.includes(ProtectedGroups.UserAdmin), args.isUserAdmin],
    [true, args.isOther],
  )
}

export async function getUser(options: {
  connection: Connection,
  client?: ContextUser,
  filter: { id: number },
}): Promise<User|undefined> {
  let { client, connection, filter } = options

  // Podminky pro vyhledani uzivatele
  let findConditions: FindConditions<User> = {}

  //#region Rozliseni dle AUTENTIZACE

  if (!client) { throw new Error('Informace neni pro neprihlasene.') }
  let groupNames = client.membership.map(g => g.group.name)

  findConditions.id = filter.id

  //#endregion

  //#region Rozliseni dle AUTORIZACE

  if (groupNames.includes(ProtectedGroups.SuperUserAdmin)) {
    // vsechny ucty
  } else if (groupNames.includes(ProtectedGroups.UserAdmin)) {
    // Vsechny ucty mimo smazane
    findConditions.removed = false
  } else if (client.id === filter.id) {
    // sam sebe => OK
  } else {
    throw new Error('Nedostatecna opravneni.')
  }

  //#endregion

  let user = await connection.manager.findOne(User, {
    where: findConditions,
  })
  return user
}

export async function getUsers(options: {
  connection: Connection,
  client?: ContextUser,
}): Promise<User[]> {
  let { client, connection } = options

  // Podminky pro vyhledani uzivatele
  let findConditions: FindConditions<User> = {}

  //#region Rozliseni dle AUTENTIZACE

  if (!client) { return [] }

  let groupNames = client.membership.map(g => g.group.name)

  //#endregion

  //#region Rozliseni dle AUTORIZACE

  if (groupNames.includes(ProtectedGroups.SuperUserAdmin)) {
    // vsechny ucty
  } else if (groupNames.includes(ProtectedGroups.UserAdmin)) {
    // Vsechny ucty mimo smazane
    findConditions.removed = false
  } else {
    // sam sebe
    findConditions.id = client.id
  }

  //#endregion

  let users = await connection.manager.find(User, {
    where: findConditions,
  })
  return users
}

export async function getMemberships(options: {
  connection: Connection,
  client?: ContextUser,
  filter: { userId: number },
}): Promise<Member[]> {
  let { client, connection, filter } = options

  // Podminky pro vyhledani uzivatele
  let memberConditions: FindConditions<Member> = {}
  let userConditions: FindConditions<User> = {}

  //#region Rozliseni dle AUTENTIZACE

  if (!client) { throw new Error('Informace neni pro neprihlasene.') }
  let groupNames = client.membership.map(g => g.group.name)

  memberConditions.userId = filter.userId

  //#endregion

  //#region Rozliseni dle AUTORIZACE

  if (groupNames.includes(ProtectedGroups.SuperGroupAdmin)) {
    // vsechny cleny
  } else if (groupNames.includes(ProtectedGroups.GroupAdmin)) {
    // Vsechny ucty mimo smazane
    userConditions.removed = false
    memberConditions.user = userConditions
  } else if (client.id === filter.userId) {
    // sam sebe => OK
  } else {
    throw new Error('Nedostatecna opravneni.')
  }

  //#endregion

  let memberships = await connection.manager.find(Member, {
    relations: ['user'],
    where: memberConditions,
  })
  return memberships
}





