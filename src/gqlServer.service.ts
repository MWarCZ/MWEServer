///////////////////////////////////////
// Soubor: src/gqlServer.service.ts
// Projekt: MWEServer
// Autor: Miroslav Válka
///////////////////////////////////////
import { startGQLServer } from './server'

startGQLServer()

const interval = 1000 * 60
setInterval(() => {
  console.log('>---------------<')
}, interval)
