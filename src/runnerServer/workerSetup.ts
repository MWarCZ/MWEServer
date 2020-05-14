///////////////////////////////////////
// Soubor: src/runnerServer/workerSetup.ts
// Projekt: MWEServer
// Autor: Miroslav Válka
///////////////////////////////////////
import {
  WorkerHelper,
  WorkerMesageNodeChanged,
  WorkerMesageProcessChanged,
  WorkerMessage,
  WorkerMessageCode,
} from '../utils/workerHelpers'
import { RunnerServer } from './runnerServer'

/**
 * Funkce pro nastaveni komunikace mezi pracovnimi vlakny
 * ze strany serveru pro beh zpracovani uzlu.
 */
export function workerSetup(options: {
  worker: WorkerHelper,
  server: RunnerServer,
}) {
  let port = options.worker.get()
  if (port) {
    // Naslouchani prichozich zprav.
    port.on('message', (msg: WorkerMessage) => {
      // napr. Vlozit uzly do zasobniku serveru.
      switch (msg.code) {
        case WorkerMessageCode.nodesChanged:
          options.server.changedNodes(msg.data)
          break
        default:
          break
      }
      console.log('Runner Server: Message:', msg)
    })
    port.on('exit', (code) => {
      console.error('Runner Server: Worker exit with code:', code)
    })
    // Zpetna volani posilajici zpravy.
    options.server.callbacks = {
      changedNodes: (nodes) => {
        let msg: WorkerMesageNodeChanged = {
          code: WorkerMessageCode.nodesChanged,
          data: nodes,
        }
        port && port.postMessage(msg)
      },
      changedProcess: (process) => {
        let msg: WorkerMesageProcessChanged = {
          code: WorkerMessageCode.processChanged,
          data: process,
        }
        port && port.postMessage(msg)
      },
    }
  }
}
