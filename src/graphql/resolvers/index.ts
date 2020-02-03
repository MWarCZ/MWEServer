import { GQLTypes } from '../generated/types'
import { Group, Query as UserQuery, User } from './user'

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
  User,
  Group,
}
export default resolvers
