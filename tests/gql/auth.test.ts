import 'jest-extended'

import { request, response } from 'express'
import { graphql } from 'graphql'
import { GraphQLServer } from 'graphql-yoga'
import { join as joinPath } from 'path'
import { getConnection } from 'typeorm'

import { ProtectedUsers } from '../../src/api/helpers'
import { Group, Member, User } from '../../src/entity'
import { MyContext } from '../../src/graphql/context'
import { createGQLServer } from '../../src/server'
import { cleanDataInTables, loadDataToDb } from '../../src/utils/db'


describe('GQL: Auth', () => {
  let server: GraphQLServer
  let context: MyContext

  beforeAll(async() => {
    server = await createGQLServer()
    let connection = await getConnection()
    await cleanDataInTables(connection, connection.entityMetadatas)
    await loadDataToDb(connection, [User, Group, Member], joinPath(__dirname, '../resources/db/UGM'))
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

  beforeEach(async() => {
    context = await server.context({ request, response })
  })

  it('Uspesne prihlaseni = Ziskani tokenu', async() => {
    let args = {
      login: ProtectedUsers.UserAdmin.toLowerCase(),
      password: ProtectedUsers.UserAdmin,
    }
    let query = `mutation {
      login(input: { login: "${args.login}", password: "${args.password}" }) {
        token
      }
    }`

    let res = await graphql(server.executableSchema, query, null, context)

    expect(res.errors).toBeUndefined()
    expect(res.data).toBeObject()
    if (res.data) {
      expect(res.data.login).toBeObject()
      if (res.data.login) {
        expect(res.data.login.token).toBeString()
        let partOfKey = (res.data.login.token as string).split('.')
        expect(partOfKey.length).toBe(3)
      }
    }
  })
  it('Neuspesne prihlaseni: Chybne heslo', async() => {
    let args = {
      login: ProtectedUsers.UserAdmin.toLowerCase(),
      password: 'aaa',
    }
    let query = `mutation {
      login(input: { login: "${args.login}", password: "${args.password}" }) {
        token
      }
    }`

    let res = await graphql(server.executableSchema, query, null, context)

    expect(res.errors).toBeArrayOfSize(1)
    expect(res.data).toBeObject()
    if (res.data) {
      expect(res.data.login).toBeNull()
    }
  })
  it('Neuspesne prihlaseni: Neexistujici uzivatel', async() => {
    let args = {
      login: 'aaa',
      password: 'aaa',
    }
    let query = `mutation {
      login(input: { login: "${args.login}", password: "${args.password}" }){
        token
      }
    }`

    let res = await graphql(server.executableSchema, query, null, context)

    expect(res.errors).toBeArrayOfSize(1)
    expect(res.data).toBeObject()
    if (res.data) {
      expect(res.data.login).toBeNull()
    }
  })


})
