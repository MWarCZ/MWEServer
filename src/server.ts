import { importSchema } from 'graphql-import'
import { GraphQLServer } from 'graphql-yoga'
import { join as pathJoin } from 'path'
import { getConnection } from 'typeorm'

import { passportUseStrategies } from './api/auth'
import { generateContextFunction } from './graphql/context'
import { resolvers } from './graphql/resolvers'

const typeDefs = importSchema(
  pathJoin(__dirname, './graphql/typeDefs/schema.graphql'),
)

export const createServer = async() => {
  let context = await generateContextFunction()
  let server =  new GraphQLServer({
    context,
    // middlewares,
    typeDefs,
    // @ts-ignore
    resolvers,
  })
  let conn = getConnection()
  passportUseStrategies(conn)
  return server
}

export const startServer = async() => {
  const server = await createServer()
  return server.start({ port: 3000 }, () => console.log('Server running :3000 ...'))
}
