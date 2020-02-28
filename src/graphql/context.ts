import { Context, ContextParameters } from 'graphql-yoga/dist/types'
import { Connection } from 'typeorm'

import { User } from '../entity'
import { createConn } from '../utils/db'

export interface MyContext extends Context, ContextParameters {
  db: Connection,
  client?: User,
}

export const generateContextFunction = async(typeormConnection?: Connection) => {
  let db = (typeormConnection)? typeormConnection : (await createConn())
  return async (param: ContextParameters): Promise<MyContext> => {
    // TODO ziskani id klienta
    let clientId = 0
    // let client = await db.manager.findOne(User, {
    //   relations: ['membership', 'membership.group'],
    //   where: {id: clientId}
    // })
    return {
      ...param,
      db,
    }
  }
}

export default generateContextFunction
