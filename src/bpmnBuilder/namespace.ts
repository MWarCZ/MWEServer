///////////////////////////////////////
// Soubor: src/bpmnBuilder/namespace.ts
// Projekt: MWEServer
// Autor: Miroslav Válka
///////////////////////////////////////

/**
 * Jmenne prostory, ktere se mohou vyskytnout v souboru BPMN.
 */
export enum BpmnNamespaceUri {
  xsi = 'http://www.w3.org/2001/XMLSchema-instance',
  bpmn2 = 'http://www.omg.org/spec/BPMN/20100524/MODEL',
  bpmndi = 'http://www.omg.org/spec/BPMN/20100524/DI',
  dc = 'http://www.omg.org/spec/DD/20100524/DC',
  di = 'http://www.omg.org/spec/DD/20100524/DI',
  camunda = 'http://camunda.org/schema/1.0/bpmn',
  mwe = 'http://www.mwarcz.cz/mwe/bpmn/',
}
/**
 * Datovy typ pro prechovavani aliasu jmennych prostoru.
 */
export type BpmnNamespace = {
  xsi: string,
  bpmn2: string,
  bpmndi: string,
  dc: string,
  di: string,
  camunda: string,
  mwe: string,
}
