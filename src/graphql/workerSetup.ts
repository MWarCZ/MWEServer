///////////////////////////////////////
// Soubor: src/graphql/workerSetup.ts
// Projekt: MWEServer
// Autor: Miroslav Válka
///////////////////////////////////////
import { PubSub } from 'graphql-yoga'

import { WorkerHelper, WorkerMessage, WorkerMessageCode } from '../utils/workerHelpers'
import { SubscriptionChanel } from './subscriptionChanel'

/**
 * Funkce pro nastaveni komunikace mezi pracovnimi vlakny
 * ze strany weboveho serveru.
 */
export function workerSetup(options: {
  workerHelper: WorkerHelper,
  pubsub: PubSub,
}) {
  const {workerHelper, pubsub} = options
  const port = workerHelper.get()
  if (port) {
    port.on('message', (msg: WorkerMessage) => {
      // napr. PubSub
      console.log('GQL Server: Message:', msg)
      if (msg.code === WorkerMessageCode.nodesChanged) {
        console.log('=== NodeChange PubSub ===')
        pubsub.publish(SubscriptionChanel.changedNodeInstances, {
          [SubscriptionChanel.changedNodeInstances]: msg.data,
        })
      }
      else if (msg.code === WorkerMessageCode.processChanged) {
        console.log('=== ProcessChange PubSub ===', msg.data)
        pubsub.publish(SubscriptionChanel.changedProcessInstance, {
          [SubscriptionChanel.changedProcessInstance]: msg.data,
        })
      }
    })
    port.on('exit', (code) => {
      console.warn('GQL Server: Worker exit with code:', code)
    })
  }
}
