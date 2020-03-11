import { ActivityStatus, NodeElementInstance } from 'entity/bpmn'
import { importSchema } from 'graphql-import'
import { GraphQLServer } from 'graphql-yoga'
import { join as pathJoin } from 'path'
import { getConnection } from 'typeorm'

import { passportUseStrategies } from './api/auth'
import { generateContextFunction } from './graphql/context'
import { resolvers } from './graphql/resolvers'
import { RunnerServer } from './runnerServer'
import { createConn } from './utils/db'

//#region GQL server

const typeDefs = importSchema(
  pathJoin(__dirname, './graphql/typeDefs/schema.graphql'),
)

export const createGQLServer = async() => {
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

export const startGQLServer = async() => {
  const server = await createGQLServer()
  return server.start({ port: 3000 }, () => console.log('Server GQL running at port 3000 ...'))
}

//#endregion

//#region Runner server

export async function createRunnerServer() {
  let connection = await createConn()
  let queueNodes = await connection.manager.find(NodeElementInstance, {
    status: ActivityStatus.Ready,
  })
  let server = new RunnerServer({
    connection,
    queueNodes,
  })
  return server
}

export async function startRunnerServer() {
  const server = await createRunnerServer()
  server.start()
  console.log('Server Runner running ...')
  return server
}

//#endregion
