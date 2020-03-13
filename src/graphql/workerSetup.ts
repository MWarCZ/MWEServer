import { WorkerHelper, WorkerMessage } from '../utils/workerHelpers'


export function workerSetup(workerHelper: WorkerHelper) {
  let port = workerHelper.get()
  if(port) {
    port.on('message', (msg: WorkerMessage) => {
      // napr. PubSub
      console.log('GQL Server: Message:', msg)
    })
    port.on('exit', (code)=> {
      console.warn('GQL Server: Worker exit with code:', code)
    })
  }
}
