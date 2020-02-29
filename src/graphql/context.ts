import { Context, ContextParameters } from 'graphql-yoga/dist/types'
import { Connection } from 'typeorm'

import { Group, Member, User } from '../entity'
import { createConn } from '../utils/db'


interface ContextUserMember extends Member {
  group: Group,
}
export interface ContextUser extends User {
  membership: ContextUserMember[]
}

export interface MyContext extends Context, ContextParameters {
  db: Connection,
  client?: ContextUser,
}

export const generateContextFunction = async(typeormConnection?: Connection) => {
  let db = (typeormConnection)? typeormConnection : (await createConn())
  return async (param: ContextParameters): Promise<MyContext> => {
    // TODO ziskani id klienta
    let clientId = 0
    let client = await db.manager.findOne(User, {
      relations: ['membership', 'membership.group'],
      where: {id: clientId}
    }) as ContextUser | undefined
    return {
      ...param,
      db,
      client,
    }
  }
}

export default generateContextFunction
