import { options } from 'bpmnBuilder/fxp.config'
import { gatewayImplementation } from 'bpmnRunnerPlugins/gateway'
import { Connection } from 'typeorm'
import { convertTemplate2Instance } from 'utils/entityHelpers'

import { scriptTaskImplementation } from '../bpmnRunnerPlugins/scriptTask'
import { taskImplementation } from '../bpmnRunnerPlugins/task'
import {
  BasicTaskInstance,
  BasicTaskTemplate,
  ConnectorSequence2Node,
  DataObjectInstance,
  DataObjectTemplate,
  EndEventInstance,
  EndEventTemplate,
  EventTemplate,
  FlowElementInstance,
  FlowElementTemplate,
  GatewayInstance,
  GatewayTemplate,
  ProcessInstance,
  ProcessTemplate,
  ScriptTaskInstance,
  ScriptTaskTemplate,
  SequenceFlowInstance,
  SequenceFlowTemplate,
  StartEventInstance,
  StartEventTemplate,
  TaskInstance,
  TaskTemplate,
} from '../entity/bpmn'
import { Constructor } from '../types/constructor'
import { getInstance, getTemplate } from './anotherHelpers'
import { executeNode } from './executeHelpers'
import * as InitHelpers from './initHelpers'
import { LibrariesWithNodeImplementations } from './pluginNodeImplementation'
import { loadContextForBasicTask } from './runContext'

// import * as bpmn from '../entity/bpmn'
/*
  [x] Vytvorit instanci procesu. PT => PI
    [x] Vytvorit instanci procesu.
    [x] Vytvorit instanci udalosti, ktera spistila proces.
  [ ] Vytvorit instanci ulohy. TT => TI
    [x] Task
    [x] ScriptTask
    [ ] ...
  [x] Vytvorit instanci udalosti. ET => EI
    [x] StartEvent
    [x] EndEvent
  [x] Vytvorit instanci brany. GT => GI
  [x] Vytvorit instanci dat.
    [x] DataObject

  [ ] Zpracovat instanci ulohy. TI
  [ ] Zpracovat instanci udalosti. EI
  [ ] Zpracovat instanci brany. GI

  [ ] Vytvorit nasledujici instance
  [ ] Poskladat datovy kontext (pr. pro data ulohy, pro data k vyhodnoceni vyrazu, ...)

*/

export class BpmnRunner {

  connection: Connection
  pluginsWithImplementations: LibrariesWithNodeImplementations

  constructor(connection: Connection, pluginsWithImplementations?: LibrariesWithNodeImplementations) {
    this.connection = connection

    this.pluginsWithImplementations = {
      task: taskImplementation,
      scriptTask: scriptTaskImplementation,
      gateway: gatewayImplementation,
    }
    if (typeof pluginsWithImplementations === 'object') {
      this.pluginsWithImplementations = {
        ...this.pluginsWithImplementations,
        ...pluginsWithImplementations,
      }
    }
  }


  //#region Funkce InitXXX - Kontrola, vytvoreni instance, ulozeni instance.

  async initElement<T extends FlowElementTemplate, I extends FlowElementInstance>(
    options: {
      templateClass: Constructor<T>,
      elementTemplate: { id: number } | T,
      processInstance: { id: number } | ProcessInstance,
      callInitNew: (processInstance: ProcessInstance, elementTemplate: T) => I,
    },
  ): Promise<I> {
    const {
      templateClass,
      processInstance,
      elementTemplate,
      callInitNew,
    } = options

    let processI = await getInstance({
      instanceClass: ProcessInstance,
      entityOrId: processInstance,
      typeormConnection: this.connection,
    })
    let elementT = await getTemplate({
      templateClass,
      entityOrId: elementTemplate,
      typeormConnection: this.connection,
    })

    let elementI = callInitNew(processI, elementT)
    return elementI
  }
  async saveElement<I extends FlowElementInstance | FlowElementInstance[]>(
    options: { elementI: I},
  ): Promise<I> {
    return this.connection.manager.save(options.elementI)
  }
  async initAndSaveElement<T extends FlowElementTemplate, I extends FlowElementInstance>(
    options: {
      templateClass: Constructor<T>,
      elementTemplate: { id: number } | T,
      processInstance: { id: number } | ProcessInstance,
      callInitNew: (processInstance: ProcessInstance, elementTemplate: T) => I,
    },
  ): Promise<I> {
    let elementI = await this.initElement(options)
    elementI = await this.saveElement({elementI})
    return elementI
  }
  async initIfUnexistElement<T extends FlowElementTemplate, I extends FlowElementInstance>(
    options: {
      templateClass: Constructor<T>,
      elementTemplate: { id: number } | T,
      processInstance: { id: number } | ProcessInstance,
      callInitNew: (processInstance: ProcessInstance, elementTemplate: T) => I,
    },
  ): Promise<I | undefined> {
    // [x] Ziskat tridu instance.
    // [x] Pokusit se najit instanci s id instance procesu a id sablony elementu.
    //    [x] Nalezeno => Vrat undefined
    //    [x] Nenalezeno => Vytvor a vrat
    //
    const { templateClass, processInstance, elementTemplate} = options
    const instanceClass = convertTemplate2Instance(templateClass)
    if (instanceClass) {
      let instanceRepo = this.connection.getRepository(instanceClass as Constructor<FlowElementInstance>)
      let result = await instanceRepo.findOne({
        processInstanceId: processInstance.id,
        templateId: elementTemplate.id
      })
      if (!result) {
        return this.initElement(options)
      }
    }
    return undefined
  }

  async initAndSaveProcess(
    processTemplate: { id: number } | ProcessTemplate,
    startEvent: { id: number } | StartEventTemplate,
  ): Promise<ProcessInstance> {
    // Vyhledani sablon
    let processT = await getTemplate({
      templateClass: ProcessTemplate,
      entityOrId: processTemplate,
      typeormConnection: this.connection,
    })
    let startEventT = await getTemplate({
      templateClass: StartEventTemplate,
      entityOrId: startEvent,
      typeormConnection: this.connection,
    })

    // Vytvoreni instance procesu
    let processInstance = InitHelpers.initNewProcess(processT)
    processInstance = await this.connection.manager.save(processInstance)

    // Vytvoreni instance prvniho startovaciho eventu
    let startEventI = await this.initStartEvent(processInstance, startEventT)
    startEventI = await this.saveElement({ elementI: startEventI })

    return processInstance
  }

  initStartEvent(
    processInstance: { id: number } | ProcessInstance,
    event: { id: number } | StartEventTemplate,
  ): Promise<StartEventInstance> {
    return this.initElement({
      callInitNew: InitHelpers.initNewStartEvent,
      processInstance,
      elementTemplate: event,
      templateClass: StartEventTemplate,
    })
  }

  initEndEvent(
    processInstance: { id: number } | ProcessInstance,
    event: { id: number } | EndEventTemplate,
  ): Promise<EndEventInstance> {
    return this.initElement({
      callInitNew: InitHelpers.initNewEndEvent,
      processInstance,
      elementTemplate: event,
      templateClass: EndEventTemplate,
    })
  }

  initGateway(
    processInstance: { id: number } | ProcessInstance,
    gateway: { id: number } | GatewayTemplate,
  ): Promise<GatewayInstance> {
    return this.initElement({
      callInitNew: InitHelpers.initNewGateway,
      processInstance,
      elementTemplate: gateway,
      templateClass: GatewayTemplate,
    })
  }

  initTask(
    processInstance: { id: number } | ProcessInstance,
    task: { id: number } | TaskTemplate,
  ): Promise<TaskInstance> {
    return this.initElement({
      callInitNew: InitHelpers.initNewTask,
      processInstance,
      elementTemplate: task,
      templateClass: TaskTemplate,
    })
  }

  initScriptTask(
    processInstance: { id: number } | ProcessInstance,
    task: { id: number } | ScriptTaskTemplate,
  ): Promise<ScriptTaskInstance> {
    return this.initElement({
      callInitNew: InitHelpers.initNewScriptTask,
      processInstance,
      elementTemplate: task,
      templateClass: ScriptTaskTemplate,
    })
  }

  initDataObject(
    processInstance: { id: number } | ProcessInstance,
    dataObject: { id: number } | DataObjectTemplate,
  ): Promise<DataObjectInstance> {
    return this.initElement({
      callInitNew: InitHelpers.initNewDataObject,
      processInstance,
      elementTemplate: dataObject,
      templateClass: DataObjectTemplate,
    })
  }

  initSequenceFlow(
    processInstance: { id: number } | ProcessInstance,
    sequence: { id: number } | SequenceFlowTemplate,
  ): Promise<SequenceFlowInstance> {
    return this.initElement({
      callInitNew: InitHelpers.initNewSequenceFlow,
      processInstance,
      elementTemplate: sequence,
      templateClass: SequenceFlowTemplate,
    })
  }



  // TODO nemam ani paru zda funguje
  async initNext(
    processInstance: { id: number } | ProcessInstance,
    sequenceFlows: (number | { id: number } | SequenceFlowTemplate)[],
  ) {
    // ziskat vsechny cile (uzly) pro vsechny sablony spoju
    let sequences = await Promise.all(sequenceFlows.map(async seq => {
      return await getTemplate({
        typeormConnection: this.connection,
        entityOrId: (typeof seq === 'number') ? { id: seq } : seq,
        templateClass: SequenceFlowTemplate,
        relations: ['target', 'target.task', 'target.gateway', 'target.event'],
      })
    }))
    // Prejit zkrze spoj na zaznamy o cilech
    let targets = sequences.map(s => s.target).filter(s => !!s) as ConnectorSequence2Node[]
    // Ziskat cile (uloha, udalost, brana)
    let tasks = targets.map(t => t.task).filter(t => !!t) as BasicTaskTemplate[]
    let events = targets.map(t => t.event).filter(t => !!t) as EventTemplate[]
    let gateways = targets.map(t => t.gateway).filter(t => !!t) as GatewayTemplate[]

    // Vytvorit a ulozit instance pro ziskane ulohy.
    await Promise.all(tasks.map(task => {
      switch (task.class) {
        case TaskTemplate.name:
          return this.initTask(processInstance, task)
        case ScriptTaskTemplate.name:
          return this.initScriptTask(processInstance, task)
      }
      return Promise.resolve(undefined)
    }))
    await Promise.all(events.map(event => {
      switch (event.class) {
        case StartEventTemplate.name:
          return this.initStartEvent(processInstance, event)
        case EndEventTemplate.name:
          return this.initEndEvent(processInstance, event)
      }
      return Promise.resolve(undefined)
    }))
    await Promise.all(gateways.map(gate => {
      return this.initGateway(processInstance, gate)
    }))



    // new SequenceFlowTemplate().target?.task?.class
  }

  //#endregion


  //#region Funkce RunXXX, ExecuteXXX

  // ExecuteXXX - synchronni funkce
  // RunXXX - asynchronni funkce

  async runIt(elementInstance: FlowElementInstance, args?: any) {
    if (elementInstance instanceof StartEventInstance) {

    } else if (elementInstance instanceof EndEventInstance) {

    } else if (elementInstance instanceof GatewayInstance) {

    } else if (elementInstance instanceof BasicTaskInstance) {
      await this.runBasicTask({
        taskInstance: elementInstance,
        taskArgs: args,
      })
    } else {
      throw new Error('Neznamou instanci nelze spustit.')
    }
  }


  async runBasicTask(options: {
    taskInstance: BasicTaskInstance,
    taskArgs: any,
  }) {
    // [x] Ziskat implementaci k vykonani ulohy
    // [x] Ziskat kontext pro danou instanci urceni pro implementaci
    // [ ] Ziskani argumentu pro implementaci (kombinace prichozich a vnitrnitch)
    //    - args napr.: Vyplneny form od uzivatele, Nactene vnitrni data (skript, jazyk, aj.), ...
    // [ ] Vykonta implementaci
    //    [x] Zavolat vykonani implementace
    //    [ ] Vytvorit instance vracenych sequenceFlow
    //    [ ] Vytvorit cilove uzly vracenych sequenceFlow
    //    [ ] Osetrit necekane chybove stavy
    // [x] Ulozit danou instanci s jejimi novymi stavy (hodnotami)

    const { taskInstance, taskArgs } = options


    let taskTemplate = await getTemplate({
      templateClass: BasicTaskTemplate,
      entityOrId: taskInstance.template || { id: taskInstance.templateId as number },
      typeormConnection: this.connection,
      relations: ['outgoing', 'outgoing.sequenceFlow'],
    })
    let implementation = this.pluginsWithImplementations[taskTemplate.implementation as string]
    if (typeof implementation !== 'object') {
      throw new Error('Implementace ulohy nenalezena.')
    }

    let context = await loadContextForBasicTask({ id: taskInstance.id as number }, this.connection)

    try {
      // TODO Zavolat init next pro ziskane id sekvenci
      let nextSequences = executeNode({
        nodeInstance: taskInstance,
        args: taskArgs,
        context,
        nodeImplementation: implementation,
      })
    } catch (e) {
      // TODO Osetrit validni vyjimky.
      console.error('runBasicTask:', e)
    }

    // Uloz instanci ktera prosla zpracovanim
    await this.connection.manager.save(taskInstance)
  }

  //#endregion

}
