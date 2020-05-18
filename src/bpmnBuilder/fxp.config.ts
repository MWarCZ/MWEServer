///////////////////////////////////////
// Soubor: src/bpmnBuilder/fxp.config.ts
// Projekt: MWEServer
// Autor: Miroslav Válka
///////////////////////////////////////
import { X2jOptionsOptional } from 'fast-xml-parser'

/**
 * Nastaveni pro zpracovani xml pomoci nastroje z balicku `fast-xml-parser`.
 */
export const options: X2jOptionsOptional = {
  attributeNamePrefix: '',
  attrNodeName: '#attr',
  textNodeName: '#text',
  ignoreAttributes: false,
  ignoreNameSpace: false,
  allowBooleanAttributes: false,
  parseNodeValue: true,
  parseAttributeValue: true,
  trimValues: true,
  cdataTagName: '#cdata',
  cdataPositionChar: '\\c',
  parseTrueNumberOnly: false,
  arrayMode: true, // "strict"
  // attrValueProcessor: (val, attrName) => he.decode(
  //  val, { isAttributeValue:true }),//default is a=>a
  // tagValueProcessor: (val, tagName) => he.decode(val), //default is a=>a
  stopNodes: ['bpmndi:BPMNDiagram'],
}
