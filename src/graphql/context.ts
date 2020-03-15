import { Context, ContextParameters } from 'graphql-yoga/dist/types'
import { Connection } from 'typeorm'

import * as ApiAuth from '../api/auth'
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
}

export const generateContextFunction = async(options?: {
  typeormConnection?: Connection,
  worker?: WorkerHelper,
}) => {
  const {typeormConnection, worker} = options || {}
  let db = (typeormConnection) ? typeormConnection : (await createConn())
  return async(param: ContextParameters): Promise<MyContext> => {
    let user: User|undefined
    try {
      let { request, response } = param
      user = await ApiAuth.authenticateBearer({
        request,
        response,
      })
    } catch {
      console.error('jwt errr')
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
    }
  }
}

export default generateContextFunction
