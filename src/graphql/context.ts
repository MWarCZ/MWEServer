import { PubSub } from 'graphql-yoga'
import { Context, ContextParameters } from 'graphql-yoga/dist/types'
import { Connection } from 'typeorm'

import * as ApiAuth from '../api/auth'
import { BpmnRunner } from '../bpmnRunner'
import { Group, Member, User } from '../entity'
import { createConn } from '../utils/db'
import { WorkerHelper } from '../utils/workerHelpers'

interface ContextUserMember extends Member {
  group: Group,
}
export interface ContextUser extends User {
  membership: ContextUserMember[]
}

export interface MyContext extends Context, ContextParameters {
  db: Connection,
  client?: ContextUser,
  worker?: WorkerHelper,
  runner?: BpmnRunner,
  pubsub: PubSub,
}

export const generateContextFunction = async(options?: {
  typeormConnection?: Connection,
  worker?: WorkerHelper,
  runner?: BpmnRunner,
  pubsub?: PubSub,
}) => {
  const {typeormConnection, worker, runner, pubsub: pubsub1} = options || {}
  let db = (typeormConnection) ? typeormConnection : (await createConn())
  const pubsub = (pubsub1) ? pubsub1 : new PubSub()
  return async(param: ContextParameters): Promise<MyContext> => {
    let user: User|undefined
    try {
      let { request, response } = param
      user = await ApiAuth.authenticateBearer({
        request,
        response,
      })
    } catch (e) {
      // console.error('Neznama chyba pri autentizaci.')
    }
    let client: ContextUser | undefined
    if (user) {
      client = await db.manager.findOne(User, {
        relations: ['membership', 'membership.group'],
        where: { id: user.id },
      }) as ContextUser | undefined
    }
    return {
      ...param,
      db,
      client,
      worker,
      runner,
      pubsub,
    }
  }
}

export default generateContextFunction
