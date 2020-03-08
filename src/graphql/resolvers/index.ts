import { GQLTypes } from '../generated/types'
import { Mutation as AuthMutation } from './auth'
import { Group, Mutation as GroupMutation, Query as GroupQuery } from './group'
import { Member, Mutation as MemberMutation } from './member'
import { Mutation as UserMutation, Query as UserQuery, User } from './user'

const testQuery: GQLTypes.QueryResolvers = {
  hello: (_, { name }): string => {
    return `Hello ${name || 'World'}.`
  },
}

export const resolvers: GQLTypes.Resolvers = {
  Query: {
    ...UserQuery,
    ...testQuery,
    ...GroupQuery,
  },
  Mutation: {
    ...UserMutation,
    ...AuthMutation,
    ...GroupMutation,
    ...MemberMutation,
  },
  User,
  Group,
  Member,
}
export default resolvers
