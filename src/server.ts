///////////////////////////////////////
// Soubor: src/server.ts
// Projekt: MWEServer
// Autor: Miroslav Válka
///////////////////////////////////////
import { existsSync as fsExists } from 'fs'
import { importSchema } from 'graphql-import'
import { GraphQLServer, PubSub } from 'graphql-yoga'
import { join as pathJoin } from 'path'

import { passportUseStrategies } from './api/auth'
import { BpmnRunner } from './bpmnRunner'
import * as CONFIG from './config'
import { User } from './entity'
import { ActivityStatus, NodeElementInstance } from './entity/bpmn'
import { generateContextFunction } from './graphql/context'
import { resolvers } from './graphql/resolvers'
import { workerSetup as workerSetupGQL } from './graphql/workerSetup'
import { RunnerServer, workerSetup as workerSetupRunner } from './runnerServer'
import { createConn } from './utils/db'
import { WorkerHelper } from './utils/workerHelpers'

//#region GQL server

/** Kompletni schema GraphQL */
const typeDefs = importSchema(
  pathJoin(__dirname, './graphql/typeDefs/schema.graphql'),
)

/**
 * Vytvoreni a nastaveni weboveho serveru GraphQL.
 */
export async function createGQLServer() {
  let connection = await createConn()

  let worker: WorkerHelper | undefined
  let pubsub: PubSub | undefined
  let filename = pathJoin(__dirname, './runnerServer.service.js')
  if (fsExists(filename)) {
    worker = new WorkerHelper({ filename })
    pubsub = new PubSub()
    workerSetupGQL({
      workerHelper: worker,
      pubsub,
    })
  } else {
    console.warn(`Server GQL: Worker '${filename}' nebylo mozne najit.`)
  }

  const systemUser = await connection.manager.findOne(User, {id: 1})

  let context = await generateContextFunction({
    typeormConnection: connection,
    worker,
    pubsub,
    runner: new BpmnRunner(connection, undefined, undefined, systemUser),
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
/**
 * Vytvoreni a spusteni weboveho serveru GraphQL.
 */
export async function startGQLServer() {
  const server = await createGQLServer()
  await server.start({
    port: CONFIG.APP_GRAPHQL_PORT,
    endpoint: CONFIG.APP_GRAPHQL_ENDPOINT,
    subscriptions: CONFIG.APP_GRAPHQL_SUBSCRIPTIONS,
    playground: CONFIG.APP_GRAPHQL_PLAYGROUND,
  })
  console.log(`Server GQL running at port ${CONFIG.APP_GRAPHQL_PORT} ...`)
  return server
}

//#endregion

//#region Runner server

/**
 * Vytvoreni a nastaveni serveru pro beh zpracovani uzlu.
 */
export async function createRunnerServer() {
  let connection = await createConn()

  let queueNodes = await connection.manager.find(NodeElementInstance, {
    status: ActivityStatus.Ready,
  })

  const systemUser = await connection.manager.findOne(User, { id: 1 })

  let server = new RunnerServer({
    connection,
    queueNodes,
    systemUser,
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
/**
 * Vytvoreni a spusteni serveru pro beh zpracoani uzlu.
 */
export async function startRunnerServer() {
  const server = await createRunnerServer()
  server.start()
  console.log('Server Runner running ...')
  return server
}

//#endregion
