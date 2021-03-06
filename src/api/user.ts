import { Connection, FindConditions } from 'typeorm'

import { Member, User } from '../entity'
import { ContextUser } from '../graphql/context'
import { OneOf } from '../utils/OneOf'
import { PossibleFilter, ProtectedGroups } from './helpers'
import { PermissionError, UnloggedUserError } from './permissionError'

export function UserOneOf(args: {
  groupNames: string[],
  isSuperUserAdmin?: () => any,
  isUserAdmin?: () => any,
  isOther?: () => any,
}) {
  return OneOf(
    [() => args.groupNames.includes(ProtectedGroups.SuperUserAdmin), args.isSuperUserAdmin],
    [() => args.groupNames.includes(ProtectedGroups.UserAdmin), args.isUserAdmin],
    [() => true, args.isOther],
  )
}


//#region Helpers

export type FilterUserById = { id: number }
export type FilterUserByLogin = { login: string }
export type FilterUserBy = FilterUserById | FilterUserByLogin


export function getUserFindConditions(options: {
  filter: FilterUserBy,
  findConditions?: FindConditions<User>,
}) {
  let findConditions: FindConditions<User> = options.findConditions || {}
  let filter = options.filter as PossibleFilter<FilterUserById, FilterUserByLogin>

  if (filter.id) {
    findConditions.id = filter.id
  } else if (filter.login) {
    findConditions.login = filter.login
  } else {
    throw new Error('Uzivatel lze identifikovat dle id nebo login')
  }
  return findConditions
}

function checkRequestHimself(options: {client?: ContextUser, filter: FilterUserBy}): boolean {
  if (!options.client) return false
  return options.client.id === (options.filter as FilterUserById).id
    || options.client.login === (options.filter as FilterUserByLogin).login
}

function randomString(length: number): string {
  let result = ''
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  const charactersLength = characters.length
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength))
  }
  return result
}

//#endregion

export async function getUser(options: {
  connection: Connection,
  client?: ContextUser,
  filter?: FilterUserBy,
}): Promise<User|undefined> {
  let { client, connection, filter } = options

  // Podminky pro vyhledani uzivatele
  let findConditions: FindConditions<User> = {}

  //#region Rozliseni dle AUTENTIZACE

  if (!client) { throw new UnloggedUserError() }
  let groupNames = client.membership.map(g => g.group.name) as string[]
  // Pokud neni filtr, tak vrati uzivatele
  if (!filter) {
    filter = { id: client.id as number }
  }

  findConditions = getUserFindConditions({filter, findConditions})

  //#endregion

  //#region Rozliseni dle AUTORIZACE

  UserOneOf({
    groupNames,
    isUserAdmin: () => {findConditions.removed = false},
    isOther: () => {
      // Pokud se nepta sam na sebe, tak hod chybu.
      if (filter && !checkRequestHimself({client, filter})) {
        throw new PermissionError()
      }
    },
  })()

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
  let groupNames = client.membership.map(g => g.group.name) as string[]

  //#endregion

  //#region Rozliseni dle AUTORIZACE

  UserOneOf({
    groupNames,
    isUserAdmin: () => { findConditions.removed = false },
    isOther: () => {
      // // Ziska sam sebe
      // const { id, login } = client || {}
      // if (id) {
      //   findConditions = getUserFindConditions({ findConditions, filter: { id } })
      // } else if (login) {
      //   findConditions = getUserFindConditions({ findConditions, filter: { login } })
      // }
      findConditions.removed = false
    },
  })()

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

  if (!client) { throw new UnloggedUserError() }
  let groupNames = client.membership.map(g => g.group.name)

  // memberConditions.userId = filter.userId
  userConditions.id = filter.userId
  memberConditions.user = userConditions
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
    return []
    // throw new PermissionError()
  }

  //#endregion

  let memberships = await connection.manager.find(Member, {
    relations: ['user'],
    where: memberConditions,
  })
  return memberships
}


export async function createNewUser(options: {
  connection: Connection,
  client?: ContextUser,
  data: {
    password: string,
    login: string,
    email?: string,
    firstName?: string,
    lastName?: string,
  },
}) {
  let { client, connection, data } = options
  //#region Rozliseni dle AUTENTIZACE

  if (!client) { throw new UnloggedUserError() }
  let groupNames = client.membership.map(g => g.group.name) as string[]

  //#endregion

  //#region Rozliseni dle AUTORIZACE

  UserOneOf({
    groupNames,
    // isSuperUserAdmin: Povoleno
    // isUserAdmin: Povoleno
    isOther: () => { throw new PermissionError() },
  })()

  //#endregion

  let user = new User({ ...data })
  user = await connection.manager.save(user)
  return user

}
export async function removeUser(options: {
  connection: Connection,
  client?: ContextUser,
  filter: FilterUserBy,
}) {
  let { client, connection, filter } = options
  let findConditions: FindConditions<User> = {}

  //#region Rozliseni dle AUTENTIZACE

  if (!client) { throw new UnloggedUserError() }
  let groupNames = client.membership.map(g => g.group.name) as string[]

  findConditions = getUserFindConditions({findConditions, filter})

  //#endregion

  //#region Rozliseni dle AUTORIZACE

  UserOneOf({
    groupNames,
    // isSuperUserAdmin: Povoleno
    // isUserAdmin: Povoleno
    isOther: () => {throw new PermissionError()},
  })()

  //#endregion

  let user = await connection.manager.findOne(User, {
    where: findConditions,
  })
  if (!user) { throw new Error('Uzivatel nenalezen') }
  user.removed = true
  user = await connection.manager.save(user)

  return user
}
export async function lockUser(options: {
  connection: Connection,
  client?: ContextUser,
  filter: FilterUserBy,
  unlock?: boolean,
}) {
  let { client, connection, filter, unlock = false } = options
  let findConditions: FindConditions<User> = {}

  //#region Rozliseni dle AUTENTIZACE

  if (!client) { throw new UnloggedUserError() }
  let groupNames = client.membership.map(g => g.group.name) as string[]

  findConditions = getUserFindConditions({ findConditions, filter })

  //#endregion

  //#region Rozliseni dle AUTORIZACE

  UserOneOf({
    groupNames,
    // isSuperUserAdmin: Povoleno
    // isUserAdmin: Povoleno
    isOther: () => { throw new PermissionError('Nedostatecna opraravneni.') },
  })()

  //#endregion

  let user = await connection.manager.findOne(User, {
    where: findConditions,
  })
  if (!user) { throw new Error('Uzivatel nenalezen') }
  if (user.protected) {
    throw new PermissionError()
  }
  user.locked = !unlock
  user = await connection.manager.save(user)

  return user
}
export async function resetUserPassword(options: {
  connection: Connection,
  client?: ContextUser,
  filter: FilterUserBy,
}): Promise<string> {
  let newPassword = randomString(10)
  let user = await changeUserPassword({
    ...options,
    data: { newPassword },
  })
  return newPassword
}
export async function changeUserPassword(options: {
  connection: Connection,
  client?: ContextUser,
  filter: FilterUserBy,
  data: { newPassword: string, oldPassword?: string },
}) {
  let { client, connection, filter, data } = options
  let findConditions: FindConditions<User> = {}

  //#region Rozliseni dle AUTENTIZACE

  if (!client) { throw new UnloggedUserError() }
  let groupNames = client.membership.map(g => g.group.name) as string[]

  findConditions = getUserFindConditions({ findConditions, filter })

  //#endregion

  //#region Rozliseni dle AUTORIZACE

  await UserOneOf({
    groupNames,
    // isSuperUserAdmin: Povoleno
    // isUserAdmin: Povoleno
    isOther: async() => {
      // Pokud nemeni heslo sam sobe.
      if (checkRequestHimself({ client, filter })) {
        console.log('áaaaaaaaaaa')
        console.log(data)
        console.log(client)
        if (client && data.oldPassword) {
          console.log('bbbbbbbbbbb')
          console.log(data)
          if (await client.comparePassword(data.oldPassword)) {
            console.log('ok')
            return
          }
        }
      }
      throw new PermissionError()
    },
  })()

  //#endregion

  let user = await connection.manager.findOne(User, {
    where: findConditions,
  })
  if (!user) { throw new Error('Uzivatel nenalezen') }
  user.password = data.newPassword
  user = await connection.manager.save(user)

  return user
}
export async function updateUserInfo(options: {
  connection: Connection,
  client?: ContextUser,
  filter: FilterUserBy,
  data: {
    email?: string,
    firstName?: string,
    lastName?: string,
  },
}) {
  let { client, connection, filter, data } = options
  let findConditions: FindConditions<User> = {}

  //#region Rozliseni dle AUTENTIZACE

  if (!client) { throw new UnloggedUserError() }
  let groupNames = client.membership.map(g => g.group.name) as string[]

  findConditions = getUserFindConditions({ findConditions, filter })

  //#endregion

  //#region Rozliseni dle AUTORIZACE

  UserOneOf({
    groupNames,
    // isSuperUserAdmin: Povoleno
    // isUserAdmin: Povoleno
    isOther: () => {
      // Pokud nemeni heslo sam sobe.
      if (!checkRequestHimself({ client, filter })) {
        throw new PermissionError()
      }
    },
  })()

  //#endregion

  let user = await connection.manager.findOne(User, {
    where: findConditions,
  })
  if (!user) { throw new Error('Uzivatel nenalezen') }
  if (typeof data.email === 'string') {
    user.email = data.email
  }
  if (typeof data.firstName === 'string') {
    user.firstName = data.firstName
  }
  if (typeof data.lastName === 'string') {
    user.lastName = data.lastName
  }
  user = await connection.manager.save(user)

  return user

}
export async function deleteUser(options: {
  connection: Connection,
  client?: ContextUser,
  filter: FilterUserBy,
}) {

  let { client, connection, filter } = options
  let findConditions: FindConditions<User> = {}

  //#region Rozliseni dle AUTENTIZACE

  if (!client) { throw new UnloggedUserError() }
  let groupNames = client.membership.map(g => g.group.name) as string[]

  findConditions = getUserFindConditions({ findConditions, filter })

  //#endregion

  //#region Rozliseni dle AUTORIZACE

  UserOneOf({
    groupNames,
    // isSuperUserAdmin: Povoleno
    isUserAdmin: () => { throw new PermissionError() },
    isOther: () => { throw new PermissionError() },
  })()

  //#endregion

  let user = await connection.manager.findOne(User, {
    where: findConditions,
  })
  if (!user) { throw new Error('Uzivatel nenalezen') }
  if (user.protected) {
    throw new PermissionError()
  }
  await connection.manager.remove(user)

  return true
}
export async function recoverUser(options: {
  connection: Connection,
  client?: ContextUser,
  filter: FilterUserBy,
}) {
  let { client, connection, filter } = options
  let findConditions: FindConditions<User> = {}

  //#region Rozliseni dle AUTENTIZACE

  if (!client) { throw new UnloggedUserError() }
  let groupNames = client.membership.map(g => g.group.name) as string[]

  findConditions = getUserFindConditions({ findConditions, filter })

  //#endregion

  //#region Rozliseni dle AUTORIZACE

  UserOneOf({
    groupNames,
    // isSuperUserAdmin: Povoleno
    isUserAdmin: () => { throw new PermissionError() },
    isOther: () => { throw new PermissionError() },
  })()

  //#endregion

  let user = await connection.manager.findOne(User, {
    where: findConditions,
  })
  if (!user) { throw new Error('Uzivatel nenalezen') }
  user.removed = false
  user = await connection.manager.save(user)

  return user
}
