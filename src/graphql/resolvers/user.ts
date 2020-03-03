import { PermissionError } from '../../api/permissionError'
import * as ApiUser from '../../api/user'
import { GQLTypes } from '../generated/types'

export const Query: GQLTypes.QueryResolvers = {
  /** Ziskat uzivatele */
  user: async(_, args, context) => {
    let user = await ApiUser.getUser({
      connection: context.db,
      client: undefined,
      filter: { id: args.id },
    })
    // @ts-ignore
    return user as GQLTypes.User || null
  },
  /** Ziskat seznam uzivatelu */
  users: async(_, args, context) => {
    let users = await ApiUser.getUsers({
      connection: context.db,
      client: context.client,
    })
    // @ts-ignore
    return users as GQLTypes.User[]
  },
}

export const Mutation: GQLTypes.MutationResolvers = {
  createNewUser: async (_, { input }, { client, db: connection }) => {
    let user = await ApiUser.createNewUser({
      connection,
      client,
      data: {
        login: input.login,
        password: input.password,
        email: input.email as string,
        firstName: input.firstName as string,
        lastName: input.lastName as string,
      }
    })
    // @ts-ignore
    return user as GQLTypes.User
  },
  removeUser: async (_, { filter }, { client, db: connection }) => { // Skryt/deaktivovat uzivatele
    let user = await ApiUser.removeUser({
      connection,
      client,
      filter: filter as ApiUser.FilterUserBy,
    })
    return !!user
  },
  lockUser: async (_, { filter }, { client, db: connection }) => {
    let user = await ApiUser.lockUser({
      connection,
      client,
      filter: filter as ApiUser.FilterUserBy,
    })
    // @ts-ignore
    return user as GQLTypes.User
  },
  unlockUser: async (_, { filter }, { client, db: connection }) => {
    let user = await ApiUser.lockUser({
      connection,
      client,
      filter: filter as ApiUser.FilterUserBy,
      unlock: true,
    })
    // @ts-ignore
    return user as GQLTypes.User
  },
  resetUserPassword: async (_, { filter }, { client, db: connection }) => {
    let password = await ApiUser.resetUserPassword({
      connection,
      client,
      filter: filter as ApiUser.FilterUserBy,
    })
    return password
  },
  changeUserPassword: async (_, { filter, input }, { client, db: connection }) => {
    let user = await ApiUser.getUser({
      connection, client, filter: filter as ApiUser.FilterUserBy,
    })
    if(!user || !(await user.comparePassword(input.oldPassword))) {
      throw new Error('Nespravne zadane stare heslo uzivatele.')
    }
    user = await ApiUser.changeUserPassword({
      connection,
      client,
      filter: filter as ApiUser.FilterUserBy,
      data: {
        newPassword: input.newPassword
      }
    })
    return !!user
  },
  updateUserInfo: async (_, { filter, input }, { client, db: connection }) => {
    let user = await ApiUser.updateUserInfo({
      connection,
      client,
      filter: filter as ApiUser.FilterUserBy,
      data: {
        email: input.email as string,
        firstName: input.firstName as string,
        lastName: input.lastName as string,
      },
    })
    // @ts-ignore
    return user as GQLTypes.User
  },
  deleteUser: async (_, { filter }, { client, db: connection }) => { // trvale odstranit
    let res = await ApiUser.deleteUser({
      connection,
      client,
      filter: filter as ApiUser.FilterUserBy,
    })
    // @ts-ignore
    return res
  },
  recoverUser: async (_, { filter }, { client, db: connection }) => { // Skryt/deaktivovat uzivatele
    let user = await ApiUser.recoverUser({
      connection,
      client,
      filter: filter as ApiUser.FilterUserBy,
    })
    // @ts-ignore
    return user as GQLTypes.User
  },
}

export const User: GQLTypes.UserResolvers = {
  membership: async (parrent, args, { client, db: connection }, info) => {
    let membersips = await ApiUser.getMemberships({
      connection,
      client,
      filter: { userId: parrent.id },
    })
    // @ts-ignore
    return membersips as GQLTypes.Member[]
  },
  removed: (parrent, args, { client }) => {
    let groupNames = ((client) ? client.membership.map(g => g.group.name) : []) as string[]
    ApiUser.UserOneOf({
      groupNames,
      isOther: () => { throw new PermissionError()},
    })
    return parrent.removed
  },
}

export const Group: GQLTypes.GroupResolvers = {
  members: async(parrent, args, context, info) => {
    // if (parrent.users) {
    //   return parrent.users
    // }
    // let group = await context.db.getRepository(Entities.Group).findOne(parrent.id, {
    //   relations: ['users'],
    // })
    // return (group) ? group.members as GQLTypes.User[] : []
    return []
  },
}
