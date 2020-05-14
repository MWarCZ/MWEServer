///////////////////////////////////////
// Soubor: src/runnerServer/runnerServer.ts
// Projekt: MWEServer
// Autor: Miroslav Válka
///////////////////////////////////////
import { Connection } from 'typeorm'

import { BpmnRunner } from '../bpmnRunner'
import { User } from '../entity'
import { ActivityStatus, NodeElementInstance, ProcessInstance } from '../entity/bpmn'

/**
 * Nazvy zpetnych volani, ktere server podporuje
 */
export enum RunnerServerCallbackName {
  changedNodes = 'changedNodes',
  changedProcess = 'changedProcess',
}

/** Knihovna zpetnych volani serveru */
export interface RunnerServerCallbacks {
  [RunnerServerCallbackName.changedNodes] ?: (nodes: NodeElementInstance[]) => any,
  [RunnerServerCallbackName.changedProcess] ?: (process: ProcessInstance) => any,
}

/**
 * Server pro beh zpracovani uzlu.
 * Jenda se o server, ktery vyuziva sluheb behoveho jadra procesu
 * k opakovanemu provadeni pripravenych uzlu.
 */
export class RunnerServer {
  /** Doba pro cekani pred opetovnym nahlednutim do fronty s pripravenymi uzly */
  msWaitTime: number
  /** Povoleni zpracovavat instance uzlu */
  execEnabled: boolean = false
  /** Priznak aktivace rezimu krokovace */
  stepper: boolean = false
  /** Signal pro preruseni cekani pred opetovnym nahlednutim do fronty s pripravenymi uzly */
  interruptionSignal?: () => void

  /** Knihovna zpetnych valani pro reakce na zmeny v instancich */
  callbacks: RunnerServerCallbacks
  /** Pripojeni k databazi */
  connection: Connection
  /** Instance hlavniho behoveho jadra procesu */
  runner: BpmnRunner

  /** Fronty */
  queues: {
    /** Fronta obsahujici pripravene instance uzlu ke zpracovani */
    nodes: NodeElementInstance[],
  }

  constructor(options: {
    connection: Connection,
    callbacks?: RunnerServerCallbacks,
    msWaitTime?: number,
    queueNodes?: NodeElementInstance[],
    systemUser?: User,
  }) {
    this.connection = options.connection
    this.runner = new BpmnRunner(this.connection, undefined, undefined, options.systemUser)
    this.callbacks = {...options.callbacks }
    this.msWaitTime = options.msWaitTime || (1000 * 60 * 60)
    this.queues = {
      nodes: options.queueNodes || [],
    }
  }

  /**
   * Povoli provadeni uzlu z fronty a spusti provadeni.
   * Navic po vyprazdneni fronty uzlu dojde k cekani a opetovne aktivaci.
   */
  start() {
    // console.log('S start')
    // console.error(process.memoryUsage().heapUsed)
    this.execEnabled = true
    this.exec().catch(e => console.error('S start E', e))
    return this
  }

  /**
   * Nastavi cekani po urcitou dobu.
   * @returns Vraci slib trvajici zadanou dobu a funkci pro preruseni slibu.
   */
  wait(ms: number = this.msWaitTime) {
    // console.log('S waiting')
    let interruptionSignal = () => { }
    const promisse = new Promise((resolve, reject) => {
      let waitTimeout = setTimeout(() => {
        resolve()
      }, ms)
      interruptionSignal = () => {
        clearTimeout(waitTimeout)
        reject('Interrupted')
      }
      return this
    })
    return {
      promisse,
      interruptionSignal,
    }
  }

  /**
   * Probudi opetovne provadeni z cekani pokud ceka.
   */
  wake() {
    // console.log('S wake')
    if (this.interruptionSignal) {
      this.interruptionSignal()
    }
    return this
  }

  /**
   * Zastavi provadeni fronty v nejblizsi mozne dobe.
   */
  stop() {
    // console.log('S stop')
    this.execEnabled = false
    return this
  }

  /**
   * Provadi postupne uzly z fronty dokud neni fronta prazdna.
   */
  async exec() {
    // console.log('S exec start')
    // console.warn(process.memoryUsage().heapUsed)

    let node: NodeElementInstance | undefined
    while (this.execEnabled) {
      while (this.execEnabled && (node = this.queues.nodes.shift())) {
        try {
          let result = await this.runner.runIt({ instance: node })

          // Upraveni fronty s uzly na zaklade vysledku
          this.changedNodes(result.targetNodeInstances)

          // Stepper => pro ladeni, vykona vzdy jen jeden krok.
          if (this.stepper) {
            this.stop()
          }

          // prochazeni zpetnych volani
          for (let key in this.callbacks) {
            let callback = (this.callbacks as any)[key]
            if (typeof callback !== 'function') break
            let args: any
            switch (key) {
              case RunnerServerCallbackName.changedNodes:
                args = [result.nodeInstance, ...result.targetNodeInstances]
                break
              case RunnerServerCallbackName.changedProcess:
                args = result.processInstance
                break
              default:

            }
            await callback(args)
          }
        } catch (e) {
          console.error('S exec E:', e)
        }
      }
      // Cekani
      let wait = this.wait(this.msWaitTime)
      this.interruptionSignal = wait.interruptionSignal
      // console.log('S exec waiting ...')
      // console.warn(process.memoryUsage().heapUsed)
      try {
        await wait.promisse
        // console.log('S exec wakeup timeout')
      } catch { console.log('S exec wakeup force') }
      // console.warn(process.memoryUsage().heapUsed)
      this.interruptionSignal = undefined
    }
    //#region xxx
    // // A) Je povoleno provadeni.
    // // B) Opakuj dokud je co provest.
    // while (this.execEnabled && (node = this.queues.nodes.shift())) {
    //   let result = await this.runner.runIt({ instance: node })

    //   // Upraveni fronty s uzly na zaklade vysledku
    //   this.changedNodes(result.targetNodeInstances)

    //   // Stepper => pro ladeni, vykona vzdy jen jeden krok.
    //   if (this.stepper) {
    //     this.stop()
    //   }

    //   // prochazeni zpetnych volani
    //   for (let key in this.callbacks) {
    //     let callback = (this.callbacks as any)[key]
    //     if (typeof callback !== 'function') break
    //     let args: any
    //     switch (key) {
    //       case RunnerServerCallbackName.changedNodes:
    //         args = result.targetNodeInstances
    //         break
    //       case RunnerServerCallbackName.changedProcess:
    //         args = result.processInstance
    //         break
    //       default:

    //     }
    //     await callback(args)
    //   }
    // }
    //#endregion
    // console.log('S exec end')
    // console.warn(process.memoryUsage().heapUsed)
    return this
  }

  /**
   * Zmeni obsah fronty s uzly na zaklade vstupnich uzlu.
   * @param nodes Uzly, ktere budou pridany/odebrany z fronty uzlu k provedeni.
   */
  changedNodes(nodes: NodeElementInstance[]) {
    // Predpriprava k filtrovani vysledku.
    let [ready, unready] = nodes.reduce((acc, targetNode) => {
      if (targetNode.status === ActivityStatus.Ready) {
        acc[0].push(targetNode)
      } else {
        acc[1].push(targetNode.id as number)
      }
      return acc
    }, [[], []] as [NodeElementInstance[], number[]])
    // Filtrovani uzlu ve fronte, ktere jiz nejsou ready
    this.queues.nodes = this.queues.nodes.filter(node => !unready.includes(node.id as number))
    // Pridani uzlu, ktere jsou nove ready
    this.queues.nodes.push(...ready)
    this.wake()
  }

  enableStepper() {
    this.stepper = true
  }
  disableStepper() {
    this.stepper = false
  }
  step() {
    console.log('S step')
    return this.start()
  }
}
