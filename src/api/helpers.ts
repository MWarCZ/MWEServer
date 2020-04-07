import { ContextUser } from '../graphql/context'

export enum ProtectedGroups {
  UserAdmin = 'UserAdmin',
  SuperUserAdmin = 'SuperUserAdmin',
  GroupAdmin = 'GroupAdmin',
  SuperGroupAdmin = 'SuperGroupAdmin',
  TopManager = 'TopManager',
  // Manager = 'Manager',
}

export enum ProtectedUsers {
  System = 'System',
  UserAdmin = 'UserAdmin',
  SuperUserAdmin = 'SuperUserAdmin',
  GroupAdmin = 'GroupAdmin',
  SuperGroupAdmin = 'SuperGroupAdmin',
}

export const ProtectedMembers = {
  [ProtectedGroups.SuperUserAdmin]: ProtectedUsers.SuperUserAdmin,
  [ProtectedGroups.UserAdmin]: ProtectedUsers.UserAdmin,
  [ProtectedGroups.SuperGroupAdmin]: ProtectedUsers.SuperGroupAdmin,
  [ProtectedGroups.GroupAdmin]: ProtectedUsers.GroupAdmin,
}

export type PossibleFilter<A, B> = Partial<A> & Partial<B>


export function getClientGroupNames(client: ContextUser): string[] {
  const groupNames = client.membership.map(g => g.group.name)
  return groupNames
}
export function getClientGroupIds(client: ContextUser): number[] {
  const groupIds = client.membership.reduce((acc, member) => {
    if (typeof member.group.id !== 'undefined') {
      acc.push(member.group.id)
    }
    return acc
  }, [] as number[])
  return groupIds
}
