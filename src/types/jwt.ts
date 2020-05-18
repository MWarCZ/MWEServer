///////////////////////////////////////
// Soubor: src/types/jwt.ts
// Projekt: MWEServer
// Autor: Miroslav Válka
///////////////////////////////////////
import { JwtHeader } from 'jsonwebtoken'

export { JwtHeader }

export interface JwtPayload {
  iat?: number,
  exp?: number,
  nbf?: number,
  [key: string]: any,
}

export interface JwtCompletePayload {
  header: JwtHeader,
  payload: JwtPayload,
  signature: string,
}
