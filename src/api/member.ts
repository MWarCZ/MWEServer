import { Connection, FindConditions } from 'typeorm'

import { Group, Member, User } from '../entity'
import { ContextUser } from '../graphql/context'
import { FilterGroupBy, getGroupFindConditions, GroupOneOf } from './group'
import { PermissionError, UnloggedUserError } from './permissionError'
import { FilterUserBy, getUserFindConditions } from './user'

export type FilterMember = {
  user: FilterUserBy,
  group: FilterGroupBy,
}

// addMember
// removeMember
// setMemberPermisions

export async function addMember(options: {
  connection: Connection,
  client?: ContextUser,
  filter: FilterMember,
  data: {
    addMember?: boolean,
    removeMember?: boolean,
    showMembers?: boolean,
  },
}) {
  let { client, connection, data, filter } = options
  let findConditions: FindConditions<Member> = {}
  //#region Rozliseni dle AUTENTIZACE

  if (!client) { throw new UnloggedUserError() }
  let groupNames = client.membership.map(g => g.group.name) as string[]

  findConditions.user = getUserFindConditions({ filter: filter.user })
  findConditions.group = getGroupFindConditions({ filter: filter.group })

  //#endregion

  //#region Rozliseni dle AUTORIZACE
  let user = await connection.manager.findOne(User, findConditions.user)
  let group = await connection.manager.findOne(Group, findConditions.group)
  if (!user || !group) {
    throw new Error('Skupina nebo uzivatel neexistuje.')
  }

  GroupOneOf({
    groupNames,
    isOther: () => {
      let isMember = client && client.membership.find(m => group && m.group.name === group.name)
      if (isMember && isMember.addMember) {
        // povoleno
      } else {
        throw new PermissionError()
      }
    },
  })()

  //#endregion

  let member = new Member({ ...data })
  member.user = user
  member.group = group
  member = await connection.manager.save(member)
  return member
}

export async function removeMember(options: {
  connection: Connection,
  client?: ContextUser,
  filter: FilterMember,
}) {
  let { client, connection, filter } = options
  let findConditions: FindConditions<Member> = {}
  //#region Rozliseni dle AUTENTIZACE

  if (!client) { throw new UnloggedUserError() }
  let groupNames = client.membership.map(g => g.group.name) as string[]

  findConditions.user = getUserFindConditions({ filter: filter.user })
  findConditions.group = getGroupFindConditions({ filter: filter.group })

  //#endregion

  //#region Rozliseni dle AUTORIZACE
  let user = await connection.manager.findOne(User, findConditions.user)
  let group = await connection.manager.findOne(Group, findConditions.group)
  if (!user || !group) {
    throw new Error('Uzivatel ci skupina neexistuje.')
  }
  findConditions.user = { id: user.id as number }
  findConditions.group = { id: group.id as number }

  await GroupOneOf({
    groupNames,
    isOther: async() => {
      let isMember = client && client.membership.find(m => group && m.group.name === group.name)
      if (isMember && isMember.removeMember) {
        // povoleno
      } else {
        throw new PermissionError()
      }
    },
  })()

  //#endregion

  let member = await connection.manager.findOne(Member, findConditions)
  if (!member) {
    throw new Error(`Clenstvi nenalezeno.`)
  }
  if (member.protected) {
    throw new PermissionError()
  }
  let res = await connection.manager.delete(Member, findConditions)
  // member = await connection.manager.remove(member)
  return true
}

export async function setMemberPermisions(options: {
  connection: Connection,
  client?: ContextUser,
  filter: FilterMember,
  data: {
    addMember?: boolean,
    removeMember?: boolean,
    showMembers?: boolean,
  },
}) {
  let { client, connection, data, filter } = options
  let findConditions: FindConditions<Member> = {}
  //#region Rozliseni dle AUTENTIZACE

  if (!client) { throw new UnloggedUserError() }
  let groupNames = client.membership.map(g => g.group.name) as string[]

  findConditions.user = getUserFindConditions({ filter: filter.user })
  findConditions.group = getGroupFindConditions({ filter: filter.group })

  //#endregion

  let user = await connection.manager.findOne(User, findConditions.user)
  let group = await connection.manager.findOne(Group, findConditions.group)
  if (!user || !group) {
    throw new Error('Uzivatel ci skupina neexistuje.')
  }
  findConditions.user = { id: user.id as number }
  findConditions.group = { id: group.id as number }

  //#region Rozliseni dle AUTORIZACE
  GroupOneOf({
    groupNames,
    isOther: () => {throw new PermissionError()},
  })()

  //#endregion

  let member = await connection.manager.findOneOrFail(Member, {
    relations: ['user', 'group'],
    where: findConditions,
  })
  if (!member) {
    throw new Error(`Clenstvi nenalezeno.`)
  }
  if (typeof data.addMember === 'boolean') {
    member.addMember = data.addMember
  }
  if (typeof data.removeMember === 'boolean') {
    member.removeMember = data.removeMember
  }
  if (typeof data.showMembers === 'boolean') {
    member.showMembers = data.showMembers
  }
  member = await connection.manager.save(member)

  return member
}


export async function getUser(options: {
  connection: Connection,
  client?: ContextUser,
  filter: FilterUserBy,
}) {
  let { client, connection, filter } = options
  let findConditions: FindConditions<User> = {}

  findConditions = getUserFindConditions({ filter })

  let user = await connection.manager.findOne(User, findConditions)
  return user
}

export async function getGroup(options: {
  connection: Connection,
  client?: ContextUser,
  filter: FilterGroupBy,
}) {
  let { client, connection, filter } = options
  let findConditions: FindConditions<Group> = {}

  findConditions = getGroupFindConditions({ filter })

  let group = await connection.manager.findOne(Group, findConditions)
  return group
}
