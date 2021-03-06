///////////////////////////////////////
// Soubor: src/bpmnRunner/pluginsImplementation.ts
// Projekt: MWEServer
// Autor: Miroslav Válka
///////////////////////////////////////
import { RunContext, RunContextProvideNodes } from './runContext'

//#region NodeImplementation
/**
 * Rozhrani definujici podobu zasuvneho modulu pro implementaci uzlu
 */
export interface NodeImplementation {
  options?: {
    // Obdrzi datove objekty A) vedou primo do uzlu X B) Vsechny datove objekty instance procesu.
    scope_inputs?: 'local' | 'global',
    // Obdrzi datove objekty A) vedou primo do uzlu X B) Vsechny datove objekty instance procesu.
    scope_outputs?: 'local' | 'global',
    // Pocet kolikrat dana instance jednoho uzlu muze existovat. (Resi problem nekonecne smycky a moznost jedinacka.)
    max_count_recurrence_node?: number,
    // Ziskat i jine uzly, ktere by mohly mit vliv na chovani (Skok v provadeni na jiny uzel)
    // Prida do `args` polozku `provideNodes` s polem uzlu, ktere vyhovuji funkci.
    provideNodes?: (node: RunContextProvideNodes) => boolean,
  }

  // Akce doplnujici hodnoty (dodatky) pro predpokladany validni pruchod pres prerun.
  additions?: NodeImplementationFunction
  // Vraci jake hodnoty (dotatky) jsou vyzadovany pro spusteni.
  additionsFormat?: NodeImplementationFlatFunction
  // Akce pred spustenim hlavniho behoveho bloku uzlu
  // pr. validace vstupu, vyhodnoceni podminek, ...
  prerun?: NodeImplementationFunction,
  // Akce hlavniho behoveho bloku uzlu
  run: NodeImplementationFunction,
  // Akce po uspesnem dokonceni behoveho bloku uzlu
  onCompleting?: NodeImplementationFunction,
  // Akce po neuspesnem dokonceni behoveho bloku uzlu
  onFailing?: NodeImplementationFunction,
}

export interface NodeImplementationFnRegister {
  [key: string]: ((...args: any[]) => void) | undefined,
}

//#region Funkce pro beh uzlu
export interface NodeImplementationFunctionOptions {
  context: RunContext,
  fn: NodeImplementationFnRegister,
}

export interface NodeImplementationFunction {
  (options: NodeImplementationFunctionOptions): any
}
//#endregion

//#region Funkce pro zjisteni informaci od uzlu
export interface NodeImplementationFlatFunctionOptions {
  context: RunContext,
}

export interface NodeImplementationFlatFunction {
  (options: NodeImplementationFlatFunctionOptions): NodeImplementationFlatItemsMap
}
export interface NodeImplementationFlatItemsMap {
  [key: string]: NodeImplementationFlatItem
}

export interface NodeImplementationFlatItem {
  type: 'checkbox' | 'password' | 'email' | 'search'
      | 'tel' | 'number' | 'text' | 'range' | 'select'
      | 'hidden' | 'html',
  default?: string | number | boolean | null | (string | number | boolean | null)[],
  possibilities?: (string | number | boolean | null)[],
  hints?: string,
}
//#endregion

export type LibrariesWithNodeImplementations = {
  [implementationRef: string]: NodeImplementation | undefined,
}

//#endregion

//#region ServiceImplementation
/** Rozharni definujici podobu zasuvneho modulu pro implementaci sluzeb */
export interface ServiceImplementation {
  name: string,
  fn: (...args: any[]) => void,
}

export interface xServiceImplementation {
  name: string,
  fn: ServiceImplementationFn,
}

export interface ServiceImplementationFn {
  (done?: ServiceImplementationCallback): void,
}
export interface ServiceImplementationCallback {
  (...args: any[]): void,
}

export type LibrariesWithServiceImplementations = ServiceImplementation[]

//#endregion
