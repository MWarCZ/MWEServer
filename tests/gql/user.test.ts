import 'jest-extended'

import { createServer } from '../../src/server'




describe('GQL', () => {
  // it('1', ()=>{

  //   console.log({
  //     __dirname,
  //     join: pathJoin(__dirname, './graphql/typeDefs/schema.graphql'),
  //   })
  //   __dirname = pathJoin(__dirname, '../../src')
  //   console.log({
  //     __dirname
  //   })
  // })
  // it('2',()=>{
  //   console.log({
  //     __dirname
  //   })
  // })

  it('xxx', async() => {
    let server = await createServer()
    let query = `query { hello }`
    // let res = await graphql(server.executableSchema, query, null, server.context)
    // console.log(res)
    console.log('============')
  })

})
