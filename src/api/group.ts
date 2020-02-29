import { Connection, FindConditions, In } from 'typeorm'

import { Group, Member } from '../entity'
import { ContextUser } from '../graphql/context'
import { OneOf } from '../utils/OneOf'
import { ProtectedGroups } from './helpers'


export function GroupOneOf(args: {
  groupNames: string[],
  isSuperGroupAdmin?: Function,
  isGroupAdmin?: Function,
  isOther?: Function,
}) {
  return OneOf(
    [args.groupNames.includes(ProtectedGroups.SuperGroupAdmin), args.isSuperGroupAdmin],
    [args.groupNames.includes(ProtectedGroups.GroupAdmin), args.isGroupAdmin],
    [true, args.isOther],
  )
}

export async function getGroup(options: {
  connection: Connection,
  client?: ContextUser,
  filter: { id: number }
}): Promise<Group|undefined> {
  let { client, connection, filter } = options

  //#region Rozliseni dle AUTENTIZACE

  if (!client) { throw new Error('Informace neni pro neprihlasene.') }

  let groupNames = client.membership.map(g => g.group.name)
  let groupIds = client.membership.map(g => g.groupId)
  let groupConditions: FindConditions<Group> = {}

  groupConditions.id = filter.id

  //#endregion

  //#region Rozliseni dle AUTORIZACE

  if (groupNames.includes(ProtectedGroups.SuperGroupAdmin)) {
    // vsechny skupiny
  } else if (groupNames.includes(ProtectedGroups.GroupAdmin)) {
    // Vsechny skupiny mimo smazane
    groupConditions.removed = false
  } else if (groupIds.includes(filter.id)) {
    // sskupiny do kterych patri kleint mimo smazane
    groupConditions.removed = false
  } else {
    throw new Error('Nedostatecna opravneni.')
  }

  //#endregion

  let group = await connection.manager.findOne(Group, {
    where: groupConditions
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
    if(groupIds.length>0) {
      groupConditions.id = In(groupIds)
    }
    groupConditions.removed = false
  }

  //#endregion

  let groups = await connection.manager.find(Group, {
    where: groupConditions
  })
  return groups
}

export async function getMembers(options: {
  connection: Connection,
  client?: ContextUser,
  filter: { groupId: number }
}): Promise<Member[]> {
  let { client, connection, filter } = options

  //#region Rozliseni dle AUTENTIZACE

  if (!client) { throw new Error('Informace neni pro neprihlasene.') }
  let groupNames = client.membership.map(g => g.group.name)
  let groupIds = client.membership.map(g => g.groupId)

  let memberConditions: FindConditions<Member> = {}
  let groupConditions: FindConditions<Group> = {}

  memberConditions.userId = filter.groupId

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
    throw new Error('Nedostatecna opravneni.')
  }

  //#endregion

  let memberships = await connection.manager.find(Member, {
    relations: ['group'],
    where: memberConditions,
  })
  return memberships
}





