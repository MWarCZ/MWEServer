import { Connection, FindConditions, In } from 'typeorm'

import { Group, Member } from '../entity'
import { ContextUser } from '../graphql/context'
import { OneOf } from '../utils/OneOf'
import { PossibleFilter, ProtectedGroups } from './helpers'
import { PermissionError, UnloggedUserError } from './permissionError'


export type FilterGroupById = { id: number }
export type FilterGroupByName = { name: string }
export type FilterGroupBy = FilterGroupById | FilterGroupByName


export function GroupOneOf(args: {
  groupNames: string[],
  isSuperGroupAdmin?: () => any,
  isGroupAdmin?: () => any,
  isOther?: () => any,
}) {
  return OneOf(
    [() => args.groupNames.includes(ProtectedGroups.SuperGroupAdmin), args.isSuperGroupAdmin],
    [() => args.groupNames.includes(ProtectedGroups.GroupAdmin), args.isGroupAdmin],
    [() => true, args.isOther],
  )
}


export function getGroupFindConditions(options: {
  filter: FilterGroupBy,
  findConditions?: FindConditions<Group>,
}) {
  let findConditions: FindConditions<Group> = options.findConditions || {}
  let filter = options.filter as PossibleFilter<FilterGroupById, FilterGroupByName>

  if (filter.id) {
    findConditions.id = filter.id
  } else if (filter.name) {
    findConditions.name = filter.name
  } else {
    throw new Error('Skupina lze identifikovat dle id nebo name.')
  }
  return findConditions
}

function checkClientMembershipWithGroup(options: {
  filter: FilterGroupBy,
  client?: ContextUser,
}): boolean {
  let filter = options.filter as PossibleFilter<FilterGroupById, FilterGroupByName>
  if (!options.client) {
    return false
  } else if (filter.id) {
    let ids = options.client.membership.map(m => m.group.id)
    return ids.includes(filter.id)
  } else if (filter.name) {
    let names = options.client.membership.map(m => m.group.name)
    return names.includes(filter.name)
  }
  return false
}

// ==========================

export async function getGroup(options: {
  connection: Connection,
  client?: ContextUser,
  filter: FilterGroupBy,
}): Promise<Group|undefined> {
  let { client, connection, filter } = options

  //#region Rozliseni dle AUTENTIZACE

  if (!client) { throw new UnloggedUserError()}

  let groupNames = client.membership.map(g => g.group.name)
  let groupIds = client.membership.map(g => g.groupId)
  let groupConditions: FindConditions<Group> = {}

  groupConditions = getGroupFindConditions({filter, findConditions: groupConditions})

  //#endregion

  //#region Rozliseni dle AUTORIZACE

  if (groupNames.includes(ProtectedGroups.SuperGroupAdmin)) {
    // vsechny skupiny
  } else if (groupNames.includes(ProtectedGroups.GroupAdmin)) {
    // Vsechny skupiny mimo smazane
    groupConditions.removed = false
  } else if (checkClientMembershipWithGroup({filter, client})) {
    // sskupiny do kterych patri kleint mimo smazane
    groupConditions.removed = false
  } else {
    throw new PermissionError()
  }

  //#endregion

  let group = await connection.manager.findOne(Group, {
    where: groupConditions,
  })
  return group
}

export async function getGroups(options: {
  connection: Connection,
  client?: ContextUser,
}): Promise<Group[]> {
  let { client, connection } = options

  //#region Rozliseni dle AUTENTIZACE

  if (!client) { return [] }
  let groupNames = client.membership.map(g => g.group.name)
  let groupIds = client.membership.map(g => g.groupId)

  let groupConditions: FindConditions<Group> = {}

  //#endregion

  //#region Rozliseni dle AUTORIZACE

  if (groupNames.includes(ProtectedGroups.SuperGroupAdmin)) {
    // vsechny skupiny
  } else if (groupNames.includes(ProtectedGroups.GroupAdmin)) {
    // Vsechny skupiny mimo smazane
    groupConditions.removed = false
  } else {
    // skupiny ve kterych uzivatel je clenem mimo smazane
    if (groupIds.length > 0) {
      groupConditions.id = In(groupIds)
    }
    groupConditions.removed = false
  }

  //#endregion

  let groups = await connection.manager.find(Group, {
    where: groupConditions,
  })
  return groups
}

export async function getMembers(options: {
  connection: Connection,
  client?: ContextUser,
  filter: { groupId: number },
}): Promise<Member[]> {
  let { client, connection, filter } = options

  //#region Rozliseni dle AUTENTIZACE

  if (!client) { throw new UnloggedUserError() }
  let groupNames = client.membership.map(g => g.group.name)
  let groupIds = client.membership.map(g => g.groupId)

  let memberConditions: FindConditions<Member> = {}
  let groupConditions: FindConditions<Group> = {}

  memberConditions.groupId = filter.groupId

  //#endregion

  //#region Rozliseni dle AUTORIZACE

  if (groupNames.includes(ProtectedGroups.SuperGroupAdmin)) {
    // vsechny skupiny
  } else if (groupNames.includes(ProtectedGroups.GroupAdmin)) {
    // Vsechny skupiny mimo smazane
    groupConditions.removed = false
    memberConditions.group = groupConditions
  } else if (groupIds.includes(filter.groupId)) {
    // skupiny do kterych patri kleint mimo smazane
    if (groupIds.length > 0) {
      groupConditions.id = In(groupIds)
    }
    groupConditions.removed = false
  } else {
    throw new PermissionError()
  }

  //#endregion

  let memberships = await connection.manager.find(Member, {
    relations: ['group'],
    where: memberConditions,
  })
  return memberships
}

// updateGroupInfo
// deleteGroup
// recoverGroup


export async function createNewGroup(options: {
  connection: Connection,
  client?: ContextUser,
  data: {
    name: string,
    describe?: string,
  },
}) {
  let { client, connection, data } = options
  //#region Rozliseni dle AUTENTIZACE

  if (!client) { throw new UnloggedUserError() }
  let groupNames = client.membership.map(g => g.group.name) as string[]

  //#endregion

  //#region Rozliseni dle AUTORIZACE

  GroupOneOf({
    groupNames,
    // isSuperGroupAdmin: Povoleno
    // isGroupAdmin: Povoleno
    isOther: () => { throw new PermissionError() },
  })()

  //#endregion

  let group = new Group({ ...data })
  group = await connection.manager.save(group)
  return group

}
export async function removeGroup(options: {
  connection: Connection,
  client?: ContextUser,
  filter: FilterGroupBy,
}) {
  let { client, connection, filter } = options
  let findConditions: FindConditions<Group> = {}

  //#region Rozliseni dle AUTENTIZACE

  if (!client) { throw new UnloggedUserError() }
  let groupNames = client.membership.map(g => g.group.name) as string[]

  findConditions = getGroupFindConditions({ findConditions, filter })

  //#endregion

  //#region Rozliseni dle AUTORIZACE

  GroupOneOf({
    groupNames,
    isOther: () => { throw new PermissionError() },
  })()

  //#endregion

  let group = await connection.manager.findOne(Group, {
    where: findConditions,
  })
  if (!group) { throw new Error('Skupina nenalezen') }
  if (group.protected) {
    throw new PermissionError()
  }
  group.removed = true
  group = await connection.manager.save(group)

  return group
}


export async function updateGroupInfo(options: {
  connection: Connection,
  client?: ContextUser,
  filter: FilterGroupBy,
  data: {
    describe?: string,
  },
}) {
  let { client, connection, filter, data } = options
  let findConditions: FindConditions<Group> = {}

  //#region Rozliseni dle AUTENTIZACE

  if (!client) { throw new UnloggedUserError() }
  let groupNames = client.membership.map(g => g.group.name) as string[]

  findConditions = getGroupFindConditions({ findConditions, filter })

  //#endregion

  //#region Rozliseni dle AUTORIZACE

  GroupOneOf({
    groupNames,
    // isSuperUserAdmin: Povoleno
    // isUserAdmin: Povoleno
    isOther: () => {
      // Pokud nemeni heslo sam sobe.
      if (!checkClientMembershipWithGroup({ client, filter })) {
        throw new PermissionError()
      }
    },
  })()

  //#endregion

  let group = await connection.manager.findOne(Group, {
    where: findConditions,
  })
  if (!group) { throw new Error('Uzivatel nenalezen') }
  data.describe && (group.describe = data.describe)
  group = await connection.manager.save(group)

  return group

}
export async function deleteGroup(options: {
  connection: Connection,
  client?: ContextUser,
  filter: FilterGroupBy,
}) {

  let { client, connection, filter } = options
  let findConditions: FindConditions<Group> = {}

  //#region Rozliseni dle AUTENTIZACE

  if (!client) { throw new UnloggedUserError() }
  let groupNames = client.membership.map(g => g.group.name) as string[]

  findConditions = getGroupFindConditions({ findConditions, filter })

  //#endregion

  //#region Rozliseni dle AUTORIZACE

  GroupOneOf({
    groupNames,
    // isSuperGroupAdmin: Povoleno
    isGroupAdmin: () => { throw new PermissionError() },
    isOther: () => { throw new PermissionError() },
  })()

  //#endregion

  let result = await connection.manager.delete(Group, {
    where: findConditions,
  })

  return true
}
export async function recoverGroup(options: {
  connection: Connection,
  client?: ContextUser,
  filter: FilterGroupBy,
}) {
  let { client, connection, filter } = options
  let findConditions: FindConditions<Group> = {}

  //#region Rozliseni dle AUTENTIZACE

  if (!client) { throw new UnloggedUserError() }
  let groupNames = client.membership.map(g => g.group.name) as string[]

  findConditions = getGroupFindConditions({ findConditions, filter })

  //#endregion

  //#region Rozliseni dle AUTORIZACE

  GroupOneOf({
    groupNames,
    // isSuperGroupAdmin: Povoleno
    isGroupAdmin: () => { throw new PermissionError() },
    isOther: () => { throw new PermissionError() },
  })()

  //#endregion

  let group = await connection.manager.findOne(Group, {
    where: findConditions,
  })
  if (!group) { throw new Error('Skupina nenalezen') }
  group.removed = false
  group = await connection.manager.save(group)

  return group
}
