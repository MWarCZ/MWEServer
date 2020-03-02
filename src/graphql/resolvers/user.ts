// import { API } from '../../utils/api'
// import { UserOneOf } from '../../utils/OneOf'
import * as ApiUser from '../../api/user'
import { GQLTypes } from '../generated/types'

// import { GroupResolvers, MutationResolvers, QueryResolvers, User as RUser, UserResolvers } from '../generated/types'
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
      client: undefined,
    })
    console.log(JSON.stringify(users))
    // @ts-ignore
    return users as GQLTypes.User[]
  },
}

export const Mutation: GQLTypes.MutationResolvers = {
  createNewUser: async(_, { input }, context) => {
    return null
  },
  removeUser: async() => { // Skryt/deaktivovat uzivatele
    return null
  },
  lockUser: async() => {
    return null
  },
  unlockUser: async() => {
    return null
  },
  resetUserPassword: async() => {
    return null
  },
  changeUserPassword: async() => {
    return null
  },
  updateUserInfo: async() => {
    return null
  },
  deleteUser: async() => { // trvale odstranit
    return null
  },
}

export const User: GQLTypes.UserResolvers = {
  membership: async(parrent, args, context, info) => {
    // @ts-ignore
    // let user = parrent as Entities.User
    console.log({User: parrent})
    // if (parrent.membership) {
    //    return parrent.membership
    // }
    let membersips = await ApiUser.getMemberships({
      connection: context.db,
      client: undefined,
      filter: { userId: parrent.id },
    })
    // @ts-ignore
    return membersips as GQLTypes.Member[]
  },
  removed: (parrent, args, context) => {
    ApiUser.UserOneOf({
      groupNames: [],
      isOther: () => { throw new Error('Nedistatecna opravneni')},
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
