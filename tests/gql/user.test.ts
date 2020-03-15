import 'jest-extended'

import { request, response } from 'express'
import { graphql } from 'graphql'
import { GraphQLServer } from 'graphql-yoga'
import { Connection, FindOneOptions, getConnection } from 'typeorm'

import { genJwt } from '../../src/api/auth'
import { ProtectedUsers } from '../../src/api/helpers'
import { UnloggedUserError } from '../../src/api/permissionError'
import { Group, Member, User } from '../../src/entity'
import { MyContext } from '../../src/graphql/context'
import { createGQLServer } from '../../src/server'
import { cleanDataInTables, loadDataToDb } from '../../src/utils/db'

describe('GQL: User', () => {
  let server: GraphQLServer
  let context: MyContext
  let connection: Connection
  beforeAll(() => {

    return createGQLServer()
      .then(ser => {
        server = ser
        return getConnection()
      })
      .then(conn => connection = conn)
      .then(conn => {
        return cleanDataInTables(connection, conn.entityMetadatas)
      })
      .then(conn => {
        return loadDataToDb(connection, [User, Group, Member], '../resources/db/UGM')
      })
  })

  beforeEach(async () => {
    context = await server.context({ request, response })
  })

  describe('Neprihlaseny uzivatel', () => {
    describe('query users = Ziskani seznamu uzivatelu.', () => {
      it('Uspesny dotaz => Prazdny seznam', async()=>{
        let query = `query {
          users {
            id
            login
          }
        }`
        let res = await graphql(server.executableSchema, query, null, context)

        expect(res.errors).toBeUndefined()
        expect(res.data).toBeObject()
        if(res.data) {
          expect(res.data.users).toBeArrayOfSize(0)
        }
      })
    })
    describe('query user = Ziskani konkretniho uzivatele.', () => {
      it.each([
        ['id', `query {
          user(filter:{id:1}) {
            id
            login
          }
        }`],
        ['login', `query {
          user(filter:{login: "${ProtectedUsers.System}"}) {
            id
            login
          }
        }`],
      ])('Neuspesny pokus ziskat uzivatele s pres jeho %s.', async (_, query) => {

        let res = await graphql(server.executableSchema, query, null, context)

        expect(res.errors).toBeArrayOfSize(1)
        res.errors && res.errors.forEach(err => {
          expect(err.message).toBe(UnloggedUserError.defaultMessage)
        })
        expect(res.data).toBeObject()
        if (res.data) {
          expect(res.data.user).toBeNull()
        }
      })
    })

    describe('Neuspechy pri pokusu o provadeni mutaci.', () => {
      it.each([
        ['createNewUser', `mutation {
          createNewUser(input:{login:"aaa", password: "aaa"}) {
            login
          }
        }`],
        ['removeUser', `mutation {
          removeUser(filter:{login: "${ProtectedUsers.UserAdmin}"})
        }`],
        ['deleteUser', `mutation {
          deleteUser(filter:{login: "${ProtectedUsers.UserAdmin}"})
        }`],
        ['lockUser', `mutation {
          lockUser(filter:{login: "${ProtectedUsers.UserAdmin}"}) {
            login
          }
        }`],
        ['unlockUser', `mutation {
          unlockUser(filter:{login: "${ProtectedUsers.UserAdmin}"}) {
            login
          }
        }`],
        ['recoverUser', `mutation {
          recoverUser(filter:{login: "${ProtectedUsers.UserAdmin}"}) {
            login
          }
        }`],
        ['resetUserPassword', `mutation {
          resetUserPassword(filter:{login: "${ProtectedUsers.UserAdmin}"})
        }`],
        ['changeUserPassword', `mutation {
          changeUserPassword(
            filter:{login: "${ProtectedUsers.UserAdmin}"},
            input:{newPassword: "bbb", oldPassword: "aaa"}
            )
        }`],
        ['updateUserInfo', `mutation {
          updateUserInfo(
            filter:{login: "${ProtectedUsers.UserAdmin}"},
            input:{firstName: "bbb", lastName: "aaa"}
            ) {
              login
            }
        }`],
      ])('Mutace %s.', async (mutationName, query) => {

        let res = await graphql(server.executableSchema, query, null, context)

        expect(res.errors).toBeArrayOfSize(1)
        res.errors && res.errors.forEach(err => {
          expect(err.message).toBe(UnloggedUserError.defaultMessage)
        })
        expect(res.data).toBeObject()
        if (res.data) {
          expect(res.data[mutationName]).toBeNull()
        }

      })
    })

  })
  describe.each([
    [
      ProtectedUsers.SuperUserAdmin,
      {} as FindOneOptions<User>,
    ],
    [
      ProtectedUsers.UserAdmin,
      { where: { removed: false } } as FindOneOptions<User>,
    ],
    [
      ProtectedUsers.GroupAdmin,
      { where: { removed: false, login: ProtectedUsers.GroupAdmin.toLowerCase() } } as FindOneOptions<User>,
    ],
  ])(`Prihlaseny uzivatel %s`, (userLogin, findOptions)=>{
    let jwt: string = ''
    beforeAll(()=>{
      return connection.manager.findOne(User, { login: userLogin})
        .then(user => {
          user && (jwt = genJwt({user}))
          context.request.headers = { authorization: `Bearer ${jwt}` }
        })
    })

    it('query users = Ziskani seznamu uzivatelu', async () => {
      let query = `query {
        users {
          id
          login
        }
      }`
      let res = await graphql(server.executableSchema, query, null, context)

      let expected = await connection.manager.find(User, findOptions)

      expect(res.errors).toBeUndefined()
      expect(res.data).toBeObject()
      if (res.data) {
        expect(res.data.users).toBeArrayOfSize(expected.length)
        res.data.users && res.data.users.forEach((user:{id:number, login: string}) => {
          let exp = expected.find(u=>u.id === user.id)
          expect(exp).toBeDefined()
          if(exp) {
            expect(user.login).toBe(exp.login)
          }
        })
      }
    })
    // TODO
  })


  it.skip('query hello: S parametrem', async () => {
    let args = {
      login: ProtectedUsers.UserAdmin.toLowerCase(),
      password: ProtectedUsers.UserAdmin,
    }
    let query = `query {
      login(input: { login: "${args.login}", password: "${args.password}" })
    }`
    let expected = { data: { hello: `Hello ${args.login}.` } }

    let res = await graphql(server.executableSchema, query, null, context)
    expect(res).toEqual(expected)
  })

})
