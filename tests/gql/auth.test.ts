import 'jest-extended'

import { request, response } from 'express'
import { graphql } from 'graphql'
import { GraphQLServer } from 'graphql-yoga'
import { getConnection } from 'typeorm'

import { ProtectedUsers } from '../../src/api/helpers'
import { Group, Member, User } from '../../src/entity'
import { MyContext } from '../../src/graphql/context'
import { createServer } from '../../src/server'
import { cleanDataInTables, loadDataToDb } from '../../src/utils/db'


describe('GQL: Auth', () => {
  let server: GraphQLServer
  let context: MyContext

  beforeAll(async () => {
    server = await createServer()
    let connection = await getConnection()
    await cleanDataInTables(connection, connection.entityMetadatas)
    await loadDataToDb(connection, [User, Group, Member], '../resources/db/UGM')
  })
  // beforeAll(() => {
  //   return createServer()
  //     .then(ser => {
  //       server = ser
  //       return getConnection()
  //     })
  //     .then(conn => DropAllInDb(conn))
  //     .then(conn => LoadDefaultDb(conn))
  // })

  beforeEach(async () => {
    context = await server.context({ request, response })
  })

  it('Uspesne prihlaseni = Ziskani tokenu', async () => {
    let args = {
      login: ProtectedUsers.UserAdmin.toLowerCase(),
      password: ProtectedUsers.UserAdmin,
    }
    let query = `mutation {
      login(input: { login: "${args.login}", password: "${args.password}" })
    }`

    let res = await graphql(server.executableSchema, query, null, context)

    expect(res.errors).toBeUndefined()
    expect(res.data).toBeObject()
    if(res.data) {
      expect(res.data.login).toBeString()
      let partOfKey = (res.data.login as string).split('.')
      expect(partOfKey.length).toBe(3)
    }
  })
  it('Neuspesne prihlaseni: Chybne heslo', async () => {
    let args = {
      login: ProtectedUsers.UserAdmin.toLowerCase(),
      password: 'aaa',
    }
    let query = `mutation {
      login(input: { login: "${args.login}", password: "${args.password}" })
    }`

    let res = await graphql(server.executableSchema, query, null, context)

    expect(res.errors).toBeArrayOfSize(1)
    expect(res.data).toBeObject()
    if (res.data) {
      expect(res.data.login).toBeNull()
    }
  })
  it('Neuspesne prihlaseni: Neexistujici uzivatel', async () => {
    let args = {
      login: 'aaa',
      password: 'aaa',
    }
    let query = `mutation {
      login(input: { login: "${args.login}", password: "${args.password}" })
    }`

    let res = await graphql(server.executableSchema, query, null, context)

    expect(res.errors).toBeArrayOfSize(1)
    expect(res.data).toBeObject()
    if (res.data) {
      expect(res.data.login).toBeNull()
    }
  })


})
