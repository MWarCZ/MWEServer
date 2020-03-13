import 'jest-extended'

import { graphql } from 'graphql'
import { GraphQLServer } from 'graphql-yoga'
import { getConnection } from 'typeorm'

import { User } from '../../src/entity'
import { createGQLServer } from '../../src/server'

describe('GQL', () => {
  let server: GraphQLServer

  beforeAll(async() => {
    server = await createGQLServer()
  })

  it('query hello: Bez parametru', async() => {
    let query = `query { hello }`
    let expected = { data: { hello: 'Hello World.' }}
    let res = await graphql(server.executableSchema, query, null, server.context)
    expect(res).toEqual(expected)
    let  con = getConnection()
    // console.log(con.entityMetadatas.map(e => [e.name, e.tableName]))
    const XUser = con.getMetadata(User)
    // console.warn([User.name, XUser.tableName])
    // console.log(con.entityMetadatas.map(e => e.tableName))

  })

  it('query hello: S parametrem', async() => {
    let args = { name: 'Adam' }
    let query = `query { hello(name: "${args.name}") }`
    let expected = { data: { hello: `Hello ${args.name}.` }}
    let res = await graphql( server.executableSchema, query, null, server.context)
    expect(res).toEqual(expected)
  })

})
