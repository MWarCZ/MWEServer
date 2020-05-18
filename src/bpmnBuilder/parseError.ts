///////////////////////////////////////
// Soubor: src/bpmnBuilder/parseError.ts
// Projekt: MWEServer
// Autor: Miroslav Válka
///////////////////////////////////////

export class ParseError extends Error {
  constructor(msg: string) {
    super(msg)
  }
}
