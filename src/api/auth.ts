import { ContextUser } from 'graphql/context'
import jwt from 'jsonwebtoken'
import passport from 'passport'
import { Strategy as BearerStrategy } from 'passport-http-bearer'
import { Strategy as LocalStrategy } from 'passport-local'
import { Connection } from 'typeorm'

import { User } from '../entity'
import { JwtCompletePayload, JwtPayload } from '../types/jwt'


export function passportUseStrategies(connection: Connection) {
  passportUseLocalStrategy(connection)
  passportUseBearerStrategy(connection)
}

//#region Passport - Local
// PODOBNE LZE UDELAT FACEBOOK, GOOGLE, AJ.

// Musi byt volana pri vytvareni serveru.
// Ve vunkci je pouzita passport strategie tj.
// funkce volana pri zadosti o autentikaci.
export function passportUseLocalStrategy(connection: Connection) {
  passport.use(new LocalStrategy(async(username, password, done) => {
    // console.log({ username, password })
    // Najit uzivatele dle loginu
    let client = await connection.manager.findOne(User, {
      login: username,
    })
    // sada kontrol
    if (!client) {
      return done(new Error(`Ucet uzivatele '${username}' neexistuje.`))
    }
    if (client.removed) {
      return done(new Error(`Ucet uzivatele '${username}' jiz neexistuje.`))
    }
    let compare = await client.comparePassword(password)
    if (!compare) {
      return done(new Error(`Ucet uzivatele '${username}' ma jine heslo.`))
    }
    if (client.locked) {
      return done(new Error(`Ucet uzivatele '${username}' je uzamknut.`))
    }
    // vse ok
    return done(undefined, client, { message: `${client.id}:${username}` })
  }))
}

// Funkce ktera pozada passport o autentikaci pomoci dane strategie.
export function authenticateLocal(options: {
  request: any, response: any, auth: { username: string, password: string },
}): Promise<User | undefined> {
  const {request, response, auth} = options
  // priprava dat pro passport
  request.body = { ...request.body, ...auth }
  return new Promise((resolve, rejects) => {
    passport.authenticate('local', (err, client) => {
      console.warn('authLocal: ', client)
      if (err) { rejects(err) }
      if (client instanceof User) {
        resolve(client)
      } else {
        rejects(new Error(`Neco se stalo s uzivatelem '${auth.username}'.`))
      }
    })(request, response)
  })
}

//#endregion

//#region Passport - bearer

export function passportUseBearerStrategy(connection: Connection) {
  passport.use(new BearerStrategy(async(token, done) => {
    try {
      let payload = validateJwt({ token })
      let clientPayload = validateJwtPayload({payload})

      let client = await connection.manager.findOne(User, {
        login: clientPayload.client.login,
        id: clientPayload.client.id,
      })
      // sada kontrol
      if (!client) {
        throw new Error(`Ucet uzivatele neexistuje.`)
      }
      if (client.removed) {
        throw new Error(`Ucet uzivatele '${client.login}' jiz neexistuje.`)
      }
      if (client.locked) {
        throw new Error(`Ucet uzivatele '${client.login}' je uzamknut.`)
      }
      // vse ok
      return done(undefined, client)
    } catch (e) {
      return done(e, undefined)
    }
  }))
}
// Nebudou nas zajimat chyby, ale pouze nalezeni ci nenalezeni uzivatele.
export function authenticateBearer( options: {
  request: any, response: any, auth?: { access_token: string },
}): Promise<User | undefined> {
  const { request, response, auth } = options
  // priprava dat pro passport
  if (auth) {
    request.body = { ...request.body, ...auth }
  }
  return new Promise((resolve, rejects) => {
    passport.authenticate('bearer', (err, client) => {
      // if (err) { rejects(err) }
      if (client instanceof User) {
        resolve(client)
      } else {
        // Klient nenalezen
        resolve(undefined)
      }
    })(request, response)
  })
}

//#endregion

//#region JWT

export interface JwtClientPayload extends JwtPayload {
  client: {
    id: number,
    login: string,
  }
}

// Mapa s moznymi hodnotami secret
let Secrets: {
  default: string,
  [key: string]: string,
} = {
  default: 'Some secrets',
}

export function genJwt(options:{
  user: User,
  expiresIn?: number | string,
  secret?: string,
}) {
  const { user, expiresIn = '1m', secret = Secrets.default } = options
  let payload: JwtClientPayload = {
    client: {
      id: user.id as number,
      login: user.login as string,
    },
  }
  let token = jwt.sign(payload, secret, {
    expiresIn,
  })

  return token
}

export function validateJwt(options: {
  token: string,
  secret?: string,
}): JwtPayload {
  const { token, secret = Secrets.default} = options

  jwt.verify(token, secret) as JwtCompletePayload
  let decoded = jwt.decode(token)
  return decoded as JwtPayload
}

// [x] Kontrola existence obsahu (JwtPayload => JwtClientPayload).
export function validateJwtPayload(options: {
  payload: JwtPayload,
}): JwtClientPayload {
  const {payload} = options
  if (!payload.client || typeof payload.client.id !== 'number' || typeof payload.client.login !== 'string') {
    throw new Error('Nevalidni payload.')
  }
  return payload as JwtClientPayload
}

// [x] Kontrola shody udaju klienta s obsahem v payload.
export function validateJwtClientPayload(options: {
  payload: JwtClientPayload,
  client: ContextUser,
}): JwtClientPayload {
  const { client, payload } = options
  if (payload.client.id !== client.id || payload.client.login !== client.login) {
    throw new Error('Nevalidni obsah payload.')
  }
  return payload
}

//#endregion

