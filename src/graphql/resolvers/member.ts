import { FilterGroupBy } from '../../api/group'
import * as ApiMember from '../../api/member'
import { FilterUserBy } from '../../api/user'
import { Member as EntityMember } from '../../entity'
import { GQLTypes } from '../generated/types'


// export const Query: GQLTypes.QueryResolvers = {
// }

export const Mutation: GQLTypes.MutationResolvers = {
  addMember: async(_, { input, filter }, { client, db: connection }) => {
    let { addMember, showMembers, removeMember } = input || {}
    let member = await ApiMember.addMember({
      connection,
      client,
      filter:{
        group: filter.group as FilterGroupBy,
        user: filter.user as FilterUserBy,
      },
      data: {
        addMember: addMember as boolean,
        showMembers: showMembers as boolean,
        removeMember: removeMember as boolean,
      },
    })
    // @ts-ignore
    return member as GQLTypes.Member
  },
  removeMember: async(_, { filter }, { client, db: connection }) => { // Skryt/deaktivovat uzivatele
    let group = await ApiMember.removeMember({
      connection,
      client,
      filter: {
        group: filter.group as FilterGroupBy,
        user: filter.user as FilterUserBy,
      },
    })
    return !!group
  },
  setMemberPermisions: async(_, { filter, input }, { client, db: connection }) => {
    let { addMember, showMembers, removeMember } = input || {}
    let member = await ApiMember.setMemberPermisions({
      connection,
      client,
      filter: {
        group: filter.group as FilterGroupBy,
        user: filter.user as FilterUserBy,
      },
      data: {
        addMember: addMember as boolean,
        showMembers: showMembers as boolean,
        removeMember: removeMember as boolean,
      },
    })
    // @ts-ignore
    return member as GQLTypes.Member
  },
}

export const Member: GQLTypes.MemberResolvers = {
  user: async(parrent, args, {db: connection, client}, info) => {
    let member = parrent as EntityMember
    // console.log('Member-user', member)
    let user = await ApiMember.getUser({
      connection,
      client,
      filter: { id: member.userId as number },
    })
    // @ts-ignore
    return user as GQLTypes.User
  },
  group: async(parrent, args, { db: connection, client }, info) => {
    let member = parrent as EntityMember
    let group = await ApiMember.getGroup({
      connection,
      client,
      filter: { id: member.groupId as number },
    })
    // @ts-ignore
    return group as GQLTypes.Group
  },
}
