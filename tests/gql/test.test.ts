import 'jest-extended'

import { graphql } from 'graphql'
import { GraphQLServer } from 'graphql-yoga'

import { createServer } from '../../src/server'

describe('GQL', () => {
  let server: GraphQLServer

  beforeAll(async() => {
    server = await createServer()
  })

  it('query hello: Bez parametru', async() => {
    let query = `query { hello }`
    let expected = { data: { hello: 'Hello World.' }}
    let res = await graphql(server.executableSchema, query, null, server.context)
    expect(res).toEqual(expected)
  })

  it('query hello: S parametrem', async() => {
    let args = { name: 'Adam' }
    let query = `query { hello(name: "${args.name}") }`
    let expected = { data: { hello: `Hello ${args.name}.` }}
    let res = await graphql( server.executableSchema, query, null, server.context)
    expect(res).toEqual(expected)
  })

})
