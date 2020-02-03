import * as Entities from '../../entity'
import { GQLTypes } from '../generated/types'

// import { GroupResolvers, MutationResolvers, QueryResolvers, User as RUser, UserResolvers } from '../generated/types'
export const Query: GQLTypes.QueryResolvers = {
  user: async() => {

    return null
  },
  users: async() => {
    return []
  },
  allUsers: async(_, args, context) => {
    let users = await context.db.getRepository(Entities.User).find()
    // console.log({users})
    return users as GQLTypes.User[]
  },
}

export const Mutation: GQLTypes.MutationResolvers = {
  createNewUser: async(_, { input }, context) => {
    return null
  },
  changeUserPassword: async() => {
    return null
  },
  updateUserInfo: async() => {
    return null
  },
  deleteUser: async() => {
    return null
  },
  lockUser: async() => {
    return null
  },
  unlockUser: async() => {
    return null
  },
}

export const User: GQLTypes.UserResolvers = {
  groups: async(parrent, args, context, info) => {
    console.log({User: parrent})
    if (parrent.groups) {
       return parrent.groups
    }
    return []
  },
}

export const Group: GQLTypes.GroupResolvers = {
  users: async(parrent, args, context, info) => {
    if (parrent.users) {
      return parrent.users
    }
    let group = await context.db.getRepository(Entities.Group).findOne(parrent.id, {
      relations: ['users'],
    })
    return (group) ? group.users as GQLTypes.User[] : []
  },
}
