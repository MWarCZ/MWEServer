///////////////////////////////////////
// Soubor: src/api/helpers.ts
// Projekt: MWEServer
// Autor: Miroslav Válka
///////////////////////////////////////
import { ContextUser } from '../graphql/context'

/** Nazvy chranenych skupin */
export enum ProtectedGroups {
  UserAdmin = 'UserAdmin',
  SuperUserAdmin = 'SuperUserAdmin',
  GroupAdmin = 'GroupAdmin',
  SuperGroupAdmin = 'SuperGroupAdmin',
  TopManager = 'TopManager',
  // Manager = 'Manager',
}

/** Nazvy chranenych uzivatelu */
export enum ProtectedUsers {
  System = 'System',
  UserAdmin = 'UserAdmin',
  SuperUserAdmin = 'SuperUserAdmin',
  GroupAdmin = 'GroupAdmin',
  SuperGroupAdmin = 'SuperGroupAdmin',
}

/** Vztahy chranenych clenstvi uzivatelu ve skupinach */
export const ProtectedMembers = {
  [ProtectedGroups.SuperUserAdmin]: ProtectedUsers.SuperUserAdmin,
  [ProtectedGroups.UserAdmin]: ProtectedUsers.UserAdmin,
  [ProtectedGroups.SuperGroupAdmin]: ProtectedUsers.SuperGroupAdmin,
  [ProtectedGroups.GroupAdmin]: ProtectedUsers.GroupAdmin,
}

export type PossibleFilter<A, B> = Partial<A> & Partial<B>

/**
 * Pomocna funkce pro ziskani seznamu nazvu skupin ve kterych je klient clenem.
 */
export function getClientGroupNames(client: ContextUser): string[] {
  const groupNames = client.membership.map(g => g.group.name)
  return groupNames
}
/**
 * Pomocna funkce pro ziskani seznamu id skupin ve kterych je klient clenem.
 */
export function getClientGroupIds(client: ContextUser): number[] {
  const groupIds = client.membership.reduce((acc, member) => {
    if (typeof member.group.id !== 'undefined') {
      acc.push(member.group.id)
    }
    return acc
  }, [] as number[])
  return groupIds
}
