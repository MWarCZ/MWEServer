import * as cron from 'node-cron'
import { Connection } from 'typeorm'

import { BpmnRunner } from '../bpmnRunner'
import { EmptyServicePlugin } from '../bpmnRunner/plugins'
import { ActivityStatus, NodeElementInstance, ProcessInstance } from '../entity/bpmn'

export enum RunnerServerCallbackName {
  changedNodes = 'changedNodes',
  changedProcess = 'changedProcess',
}

export interface RunnerServerCallbacks {
  [RunnerServerCallbackName.changedNodes] ?: (nodes: NodeElementInstance[]) => any,
  [RunnerServerCallbackName.changedProcess] ?: (process: ProcessInstance) => any,
}

//#region Timer

export interface TimerItem {
  tasks: cron.ScheduledTask[],
  node: number,
}

export interface ExtendedNodeImpFnRegister {
  setWakeup: (cronExpression: string) => void
}

//#endregion

export class RunnerServer {
  msWaitTime: number
  waitTimeout?: NodeJS.Timeout
  execPromise: Promise<this> = Promise.resolve(this)
  execEnabled: boolean = false
  stepper: boolean = false

  callbacks: RunnerServerCallbacks

  connection: Connection
  runner: BpmnRunner

  queues: {
    nodes: NodeElementInstance[],
    timer: TimerItem[],
  }

  constructor(options: {
    connection: Connection,
    callbacks?: RunnerServerCallbacks,
    msWaitTime?: number,
    queueNodes?: NodeElementInstance[],
    queueTimer?: TimerItem[],
  }) {
    this.connection = options.connection
    let serviceTimer = new EmptyServicePlugin({
      name: 'wakeAt',
      done: (...args) => { },
    })
    this.runner = new BpmnRunner(this.connection, undefined, [serviceTimer])
    this.callbacks = {...options.callbacks }
    this.msWaitTime = options.msWaitTime || 1000 * 60
    this.queues = {
      nodes: options.queueNodes || [],
      timer: options.queueTimer || [],
    }
  }

  loadTimer(nodeId: number) {
    let cronExpression: string = ''
    // Validace vyrazu cron
    let valid = cron.validate(cronExpression)
    if(valid) {
      let task = cron.schedule(cronExpression, async () => {
        let waitingNode = await this.connection.manager.findOne(NodeElementInstance, {
          where: {
            id: nodeId,
            status: ActivityStatus.Waiting,
          }
        })
        if (waitingNode) {
          waitingNode.status = ActivityStatus.Ready,
          await this.connection.manager.save(waitingNode)
        }
        // Najdi ulohu task ve fronte uloh a odstran ji.
        // TODO
      }, { scheduled: false })
    }

    const done = (tasks: TimerItem[]) => {
      this.queues.timer.push(...tasks)
    }
    let fn: ExtendedNodeImpFnRegister = {
      setWakeup: (cronExpression: string) => {
        let valid = cron.validate(cronExpression)
        if (valid) {
          let task = cron.schedule(cronExpression, () => {

          }, {scheduled: false})
          let timerItem: TimerItem = {
            node: -1,
            tasks: [task],
          }
          done([timerItem])
        }
      },
    }
    interface xxx {
      aaa: (...args:any[]) => void
      [key: string]: any
      [key: number]: any
    }
    let a: xxx = {
      aaa: (name, xxx) => { },
    }
  }

  /**
   * Povoli provadeni uzlu z fronty a spusti provadeni.
   * Navic po vyprazdneni fronty uzlu dojde k cekani a opetovne aktivaci.
   */
  start() {
    console.log('S start')
    console.error(process.memoryUsage().heapUsed)
    this.execEnabled = true
    this.waitExec()
    return this
  }

  /**
   * Nastavi waitTimeout po kterem se opet spusti vykonavani uzlu z fronty.
   */
  wait() {
    console.log('S waiting')
    this.waitTimeout = setTimeout(
      () => this.waitExec(),
      this.msWaitTime,
    )
    return this
  }
  waitExec() {
    return this.execPromise = this.exec().then(_ => this.wait())
  }

  /**
   * Probudi opetovne provadeni ze cekani pokud ceka.
   */
  wake() {
    console.log('S wake')
    if (this.waitTimeout) {
      console.log('S wakeUP')
      clearTimeout(this.waitTimeout)
      this.waitTimeout = undefined
      this.waitExec()
    }
    return this
  }

  /**
   * Zastavi provadeni fronty v nejblizsi mozne dobe.
   */
  stop() {
    console.log('S stop')
    this.execEnabled = false
    this.waitTimeout && clearTimeout(this.waitTimeout)
    this.waitTimeout = undefined
    return this.execPromise
  }

  /**
   * Provadi postupne uzly z fronty dokud neni fronta prazdna.
   */
  async exec() {
    console.log('S exec start')

    let node: NodeElementInstance | undefined
    // A) Je povoleno provadeni.
    // B) Opakuj dokud je co provest.
    while (this.execEnabled && (node = this.queues.nodes.shift())) {
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
            args = result.targetNodeInstances
            break
          case RunnerServerCallbackName.changedProcess:
            args = result.processInstance
            break
          default:

        }
        await callback(args)
      }
    }

    console.log('S exec end')
    console.warn(process.memoryUsage().heapUsed)
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
    this.start()
  }
}
