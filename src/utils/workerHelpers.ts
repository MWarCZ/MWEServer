///////////////////////////////////////
// Soubor: src/utils/workerHelpers.ts
// Projekt: MWEServer
// Autor: Miroslav Válka
///////////////////////////////////////
import { isMainThread, MessagePort, parentPort, Worker } from 'worker_threads'

import { NodeElementInstance, ProcessInstance } from '../entity/bpmn'

// import process from 'process'

/** Kody zprav pro rozliseni typu zpravy pri komunikaci mezi pracovnimi vlakny. */
export enum WorkerMessageCode {
  wake, // Probud pracanta => pokud ceka
  end, // Ukonci pracanta => prerus nekonecny cyklus

  // bpmn
  nodesChanged, // Pole s uzly, ktere se zmenily. (pridani do zasobniku)
    // Pravdepodobne test => pridat nove uzly ready, odstranit uzly nejsou ready ZE zasobniku.
  processChanged,
}

/** Zprava urcena ke komunikaci mezi pracovnimi vlakny */
export type WorkerMessage = WorkerMesageNodeChanged | WorkerMesageProcessChanged

/** Zprava typu oznameni o zmenach instanci uzlu */
export interface WorkerMesageNodeChanged {
  code: WorkerMessageCode.nodesChanged,
  data: NodeElementInstance[],
}
/** Zprava typu oznameni o zmenach instance procesu */
export interface WorkerMesageProcessChanged {
  code: WorkerMessageCode.processChanged,
  data: ProcessInstance,
}

/** Funkce pro odeslani zpravy o zmene instancich uzlu */
export async function postChangedNodes(options: {
  port: MessagePort | Worker,
  nodes: NodeElementInstance[],
}) {
  // Odlehceni dat v instanci uzlu => odebrani vztahu.
  let nodes = options.nodes.map(node => {
    delete node.template
    delete node.processInstance
    return node
  })
  // Vytvoreni zpravy
  let msg: WorkerMesageNodeChanged = {
    code: WorkerMessageCode.nodesChanged,
    data: nodes,
  }
  // Odeslani zpravy
  options.port.postMessage(msg)
}
/** Funkce pro odeslani zpravy o zmene instance procesu */
export async function postChangedProcess(options: {
  port: MessagePort | Worker,
  process: ProcessInstance,
}) {
  // Odlehceni dat v instanci uzlu => odebrani vztahu.
  let process = options.process
  delete process.processTemplate
  delete process.dataObjects
  delete process.nodeElements
  delete process.sequenceFlows

  // Vytvoreni zpravy
  let msg: WorkerMesageProcessChanged = {
    code: WorkerMessageCode.processChanged,
    data: process,
  }
  // Odeslani zpravy
  options.port.postMessage(msg)
}

/**
 * Pomocny objekt obalujici praci s pracovnimi vlakny a pracovniky.
 * Zjednodusuje pouziti ve vlaknech.
 * Resi rozdily mezi hlavnim a vedlejsim vlaknem.
 */
export class WorkerHelper {
  worker?: Worker
  port?: MessagePort

  constructor(options: {
    filename: string,
  }) {
    if (isMainThread) {
      this.worker = new Worker(options.filename)
    } else {
      if (parentPort) {
        this.port = parentPort
      } else {
        throw new Error('Nenjedna se o hlavni vlakno ani pracovnika.')
      }
    }
  }

  get() {
    return this.worker || this.port
  }

  postChangedNodes(nodes: NodeElementInstance[]) {
    let port = this.get()
    port && postChangedNodes({
        port,
        nodes,
    })
  }
  postChangedProcess(process: ProcessInstance) {
    let port = this.get()
    port && postChangedProcess({
      port,
      process,
    })
  }
}
