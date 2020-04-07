import { existsSync as fsExists } from 'fs'
import { importSchema } from 'graphql-import'
import { GraphQLServer } from 'graphql-yoga'
import { join as pathJoin } from 'path'

import { passportUseStrategies } from './api/auth'
import { BpmnRunner } from './bpmnRunner'
import { ActivityStatus, NodeElementInstance } from './entity/bpmn'
import { generateContextFunction } from './graphql/context'
import { resolvers } from './graphql/resolvers'
import { workerSetup as workerSetupGQL } from './graphql/workerSetup'
import { RunnerServer, workerSetup as workerSetupRunner } from './runnerServer'
import { createConn } from './utils/db'
import { WorkerHelper } from './utils/workerHelpers'

//#region GQL server

const typeDefs = importSchema(
  pathJoin(__dirname, './graphql/typeDefs/schema.graphql'),
)

export async function createGQLServer() {
  let connection = await createConn()

  let worker: WorkerHelper | undefined
  let filename = pathJoin(__dirname, './runnerServer.service.js')
  if (fsExists(filename)) {
    worker = new WorkerHelper({ filename })
    workerSetupGQL(worker)
  } else {
    console.warn(`Server GQL: Worker '${filename}' nebylo mozne najit.`)
  }

  let context = await generateContextFunction({
    typeormConnection: connection,
    worker,
    runner: new BpmnRunner(connection),
  })
  let server =  new GraphQLServer({
    context,
    // middlewares,
    typeDefs,
    // @ts-ignore
    resolvers,
  })
  // let conn = getConnection()
  passportUseStrategies(connection)
  return server
}

export async function startGQLServer() {
  const server = await createGQLServer()
  await server.start({
    port: 4000,
    endpoint: '/graphql',
  })
  console.log('Server GQL running at port 4000 ...')
  return server
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

  let worker: WorkerHelper | undefined
  let filename = pathJoin(__dirname, './gqlServer.service.js')
  if (fsExists(filename)) {
    worker = new WorkerHelper({ filename })
    workerSetupRunner({
      worker,
      server,
    })
    // workerSetupGQL(worker)
  } else {
    console.warn(`Server Runner: Worker '${filename}' nebylo mozne najit.`)
  }

  return server
}

export async function startRunnerServer() {
  const server = await createRunnerServer()
  server.start()
  console.log('Server Runner running ...')
  return server
}

//#endregion
