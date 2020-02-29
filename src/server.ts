import { importSchema } from 'graphql-import'
import { GraphQLServer } from 'graphql-yoga'
import { join as pathJoin } from 'path'

import { generateContextFunction } from './graphql/context'
import { resolvers } from './graphql/resolvers'

const typeDefs = importSchema(
  pathJoin(__dirname, './graphql/typeDefs/schema.graphql'),
)

export const createServer = async() => {
  console.warn({__dirname})
  return new GraphQLServer({
    context: await generateContextFunction(),
    // middlewares,
    typeDefs,
    // @ts-ignore
    resolvers,
  })
}

export const startServer = async () => {
  const server = await createServer()
  server.start({ port: 3000 }, () => console.log('Server running ...'))
}

startServer()
