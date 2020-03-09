
export enum ProtectedGroups {
  UserAdmin = 'UserAdmin',
  SuperUserAdmin = 'SuperUserAdmin',
  GroupAdmin = 'GroupAdmin',
  SuperGroupAdmin = 'SuperGroupAdmin',
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
