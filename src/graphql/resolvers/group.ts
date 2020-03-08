import * as ApiGroup from '../../api/group'
import { GQLTypes } from '../generated/types'


export const Query: GQLTypes.QueryResolvers = {
  /** Ziskat uzivatele */
  group: async (_, { filter }, { client, db: connection }) => {
    let user = await ApiGroup.getGroup({
      connection,
      client,
      filter: filter as ApiGroup.FilterGroupBy,
    })
    // @ts-ignore
    return user as GQLTypes.Group || null
  },
  /** Ziskat seznam uzivatelu */
  groups: async (_, args, { client, db: connection }) => {
    let users = await ApiGroup.getGroups({
      connection,
      client,
    })
    // @ts-ignore
    return users as GQLTypes.Group[]
  },
}

export const Mutation: GQLTypes.MutationResolvers = {
  createNewGroup: async(_, { input }, { client, db: connection }) => {
    let user = await ApiGroup.createNewGroup({
      connection,
      client,
      data: {
        name: input.name,
        describe: input.describe as string,
      },
    })
    // @ts-ignore
    return user as GQLTypes.Group
  },
  removeGroup: async(_, { filter }, { client, db: connection }) => { // Skryt/deaktivovat uzivatele
    let group = await ApiGroup.removeGroup({
      connection,
      client,
      filter: filter as ApiGroup.FilterGroupBy,
    })
    return !!group
  },
  updateGroupInfo: async(_, { filter, input }, { client, db: connection }) => {
    let group = await ApiGroup.updateGroupInfo({
      connection,
      client,
      filter: filter as ApiGroup.FilterGroupBy,
      data: {
        describe: input.describe as string,
      },
    })
    // @ts-ignore
    return group as GQLTypes.Group
  },
  deleteGroup: async(_, { filter }, { client, db: connection }) => { // trvale odstranit
    let res = await ApiGroup.deleteGroup({
      connection,
      client,
      filter: filter as ApiGroup.FilterGroupBy,
    })
    // @ts-ignore
    return res
  },
  recoverGroup: async(_, { filter }, { client, db: connection }) => { // Skryt/deaktivovat uzivatele
    let group = await ApiGroup.recoverGroup({
      connection,
      client,
      filter: filter as ApiGroup.FilterGroupBy,
    })
    // @ts-ignore
    return group as GQLTypes.Group
  },
}

export const Group: GQLTypes.GroupResolvers = {
  members: async (parrent, args, {db: connection, client}, info) => {
    let membersips = await ApiGroup.getMembers({
      connection,
      client,
      filter: { groupId: parrent.id },
    })
    // @ts-ignore
    return membersips as GQLTypes.Member[]
  },
}
