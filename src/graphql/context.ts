import { Context, ContextParameters } from 'graphql-yoga/dist/types'
import { Connection } from 'typeorm'

import { createConn } from '../utils/db'

export interface MyContext extends Context, ContextParameters {
  db: Connection
}

// let db: Connection;
// createConn().then(conn=>db=conn)

export const getContext = async() => {
  let db = await createConn()
  return (param: ContextParameters): MyContext => {
    // console.log('DB', { db })
    return {
      ...param,
      db,
    }
  }
}

// export const context = (param: ContextParameters): MyContext => {
//   // const { request } = param
//   console.log('DB',{db})
//   return {
//     ...param,
//     db,
//   }
// }

export default getContext
