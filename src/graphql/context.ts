import { Context, ContextParameters } from 'graphql-yoga/dist/types'
import { Connection } from 'typeorm'

import { createConn } from '../utils/db'

export interface MyContext extends Context, ContextParameters {
  db: Connection,
}

export const generateContextFunction = async(typeormConnection?: Connection) => {
  let db = (typeormConnection)? typeormConnection : (await createConn())
  return (param: ContextParameters): MyContext => {
    // console.log('DB', { db })
    return {
      ...param,
      db,
    }
  }
}

export default generateContextFunction
