import { importSchema } from 'graphql-import'
import { GraphQLServer } from 'graphql-yoga'
import { join as pathJoin } from 'path'

import { getContext } from './graphql/context'
import { resolvers } from './graphql/resolvers'

const typeDefs = importSchema(
  pathJoin(__dirname, './graphql/typeDefs/schema.graphql'),
)

// const resolvers = {
//   Query: {
//     hello: (_: void, { name }: { name: string }): string => {
//       return `Hello ${name || 'World'}.`
//     },
//     bpmn: (): any => {
//       return { id: 'process id'}
//     },
//   },
// }
// const context = (param: ContextParameters): Context => {
//   // const { request } = param
//   return {}
// }
// console.log({ resolvers})
// console.log(typeDefs)

// const server = new GraphQLServer({
//   context: getContext(),
//   // middlewares,
//   typeDefs,
//   // @ts-ignore
//   resolvers
// })
// server.start({ port: 3000 }, () => console.log('Server running ...'))

const startServer = async() => {
  const server = new GraphQLServer({
    context: await getContext(),
    // middlewares,
    typeDefs,
    // @ts-ignore
    resolvers,
  })
  server.start({ port: 3000 }, () => console.log('Server running ...'))
}
startServer()
