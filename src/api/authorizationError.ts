///////////////////////////////////////
// Soubor: src/api/authorizationError.ts
// Projekt: MWEServer
// Autor: Miroslav Válka
///////////////////////////////////////

/**
 * Chyba autentizace uzivatele.
 */
export class AuthorizationError extends Error {
  static defaultMessage = `We were unable to verify your identity.`
  static defaultMessageCZ = `Nepodařilo se nám ověřit vaši totožnost.`
  constructor(msg: string = AuthorizationError.defaultMessageCZ) {
    super(msg)
  }
}
