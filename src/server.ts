import { importSchema } from 'graphql-import'
import { GraphQLServer } from 'graphql-yoga'
import { Context, ContextParameters } from 'graphql-yoga/dist/types'
import { join as pathJoin } from 'path'

const typeDefs = importSchema(
  pathJoin(__dirname, './graphql/typeDefs/schema.graphql'),
)

const resolvers = {
  Query: {
    hello: (_: void, { name }: { name: string }): string => {
      return `Hello ${name || 'World'}.`
    },
    bpmn: (): any => {
      return { id: 'process id'}
    },
  },
}
const context = (param: ContextParameters): Context => {
  // const { request } = param
  return {}
}

const server = new GraphQLServer({
  // context,
  // middlewares,
  typeDefs,
  resolvers,
})
server.start({ port: 3000 }, () => console.log('Server running ...'))
