import { GQLTypes } from '../generated/types'
import { Mutation as AuthMutation } from './auth'
import { Group, Mutation as UserMutation, Query as UserQuery, User } from './user'

const testQuery: GQLTypes.QueryResolvers = {
  hello: (_, { name }): string => {
    return `Hello ${name || 'World'}.`
  },
  bpmn: (): any => {
    return { id: 'process id' }
  },
}

export const resolvers: GQLTypes.Resolvers = {
  Query: {
    ...UserQuery,
    ...testQuery,
  },
  Mutation: {
    ...UserMutation,
    ...AuthMutation,
  },
  User,
  Group,
}
export default resolvers
