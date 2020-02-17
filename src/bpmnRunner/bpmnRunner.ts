import { options } from 'bpmnBuilder/fxp.config'
import { gatewayImplementation } from 'bpmnRunnerPlugins/gateway'
import { Connection, In } from 'typeorm'
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

  [ ] Vytvorit nasledujici instance (HARD AS FUCK)
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
      elementTemplate: ({ id: number } | T)[],
      processInstance: { id: number } | ProcessInstance,
      callInitNew: (processInstance: ProcessInstance, elementTemplate: T) => I,
    },
  ): Promise<I[]> {
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
    let elementIs = await Promise.all(elementTemplate.map(async entityOrId=>{
      let elementT = await getTemplate({
        templateClass,
        entityOrId,
        typeormConnection: this.connection,
      })
      let elementI = callInitNew(processI, elementT)
      return elementI
    }))
    return elementIs
  }
  async saveElement<I extends FlowElementInstance | FlowElementInstance[]>(
    elementI: I,
  ): Promise<I> {
    return this.connection.manager.save(elementI)
  }
  async initAndSaveElement<T extends FlowElementTemplate, I extends FlowElementInstance>(
    options: {
      templateClass: Constructor<T>,
      elementTemplate: ({ id: number } | T)[],
      processInstance: { id: number } | ProcessInstance,
      callInitNew: (processInstance: ProcessInstance, elementTemplate: T) => I,
    },
  ): Promise<I[]> {
    let elementI = await this.initElement(options)
    elementI = await this.saveElement(elementI)
    return elementI
  }
  async initIfUnexistElement<T extends FlowElementTemplate, I extends FlowElementInstance>(
    options: {
      templateClass: Constructor<T>,
      elementTemplate: ({ id: number } | T)[],
      processInstance: { id: number } | ProcessInstance,
      callInitNew: (processInstance: ProcessInstance, elementTemplate: T) => I,
    },
  ): Promise<I[]> {
    // [x] Ziskat tridu instance.
    // [x] Pokusit se najit instance s id instance procesu a id sablon elementu.
    // [x] Polezt sablony elementu
    //    [x] Kontrola shody id sablony elemenu na existujici ziskane instance
    //    [x] Nenalezena shoda, tak proved inicializaci
    // [x] Vrat vsechny uspesne inicializovane instance elementu
    //
    const { templateClass, processInstance, elementTemplate} = options
    const instanceClass = convertTemplate2Instance(templateClass)
    if (instanceClass) {
      let instanceRepo = this.connection.getRepository(instanceClass as Constructor<FlowElementInstance>)

      let elementIds = elementTemplate.map(e=>e.id)
      // Najde vsechny instance elementu
      let result = await instanceRepo.find({
        processInstanceId: processInstance.id,
        templateId: In(elementIds),
      })
      let resultIds = result.map(r=>r.templateId)

      let tmpMatrixWithElementInstance = await Promise.all(elementTemplate.map(template=>{
        let isIn = resultIds.includes(template.id)
        return (isIn) ? [] : this.initElement({
          ...options,
          elementTemplate: [template],
        })
      }))
      let elementInstances = tmpMatrixWithElementInstance.reduce((acc, value)=>{
        return {...acc, ...value}
      })
      return elementInstances
    }
    return []
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
    let startEventI = await this.initStartEvent(processInstance, [startEventT])
    startEventI = await this.saveElement(startEventI)

    return processInstance
  }

  initStartEvent(
    processInstance: { id: number } | ProcessInstance,
    event: ({ id: number } | StartEventTemplate)[],
    onlyIfUnexist: boolean = false,
  ): Promise<StartEventInstance[]> {
    let options = {
      callInitNew: InitHelpers.initNewStartEvent,
      processInstance,
      elementTemplate: event,
      templateClass: StartEventTemplate,
    }
    return (onlyIfUnexist) ? this.initIfUnexistElement(options) : this.initElement(options)
  }

  initEndEvent(
    processInstance: { id: number } | ProcessInstance,
    event: ({ id: number } | EndEventTemplate)[],
    onlyIfUnexist: boolean = false,
  ): Promise<EndEventInstance[]> {
    let options = {
      callInitNew: InitHelpers.initNewEndEvent,
      processInstance,
      elementTemplate: event,
      templateClass: EndEventTemplate,
    }
    return (onlyIfUnexist) ? this.initIfUnexistElement(options) : this.initElement(options)
  }

  initGateway(
    processInstance: { id: number } | ProcessInstance,
    gateway: ({ id: number } | GatewayTemplate)[],
    onlyIfUnexist: boolean = false,
  ): Promise<GatewayInstance[]> {
    let options = {
      callInitNew: InitHelpers.initNewGateway,
      processInstance,
      elementTemplate: gateway,
      templateClass: GatewayTemplate,
    }
    return (onlyIfUnexist) ? this.initIfUnexistElement(options) : this.initElement(options)
  }

  initTask(
    processInstance: { id: number } | ProcessInstance,
    task: ({ id: number } | TaskTemplate)[],
    onlyIfUnexist: boolean = false,
  ): Promise<TaskInstance[]> {
    let options = {
      callInitNew: InitHelpers.initNewTask,
      processInstance,
      elementTemplate: task,
      templateClass: TaskTemplate,
    }
    return (onlyIfUnexist) ? this.initIfUnexistElement(options) : this.initElement(options)
  }

  initScriptTask(
    processInstance: { id: number } | ProcessInstance,
    task: ({ id: number } | ScriptTaskTemplate)[],
    onlyIfUnexist: boolean = false,
  ): Promise<ScriptTaskInstance[]> {
    let options = {
      callInitNew: InitHelpers.initNewScriptTask,
      processInstance,
      elementTemplate: task,
      templateClass: ScriptTaskTemplate,
    }
    return (onlyIfUnexist) ? this.initIfUnexistElement(options) : this.initElement(options)
  }

  initDataObject(
    processInstance: { id: number } | ProcessInstance,
    dataObject: ({ id: number } | DataObjectTemplate)[],
    onlyIfUnexist: boolean = false,
  ): Promise<DataObjectInstance[]> {
    let options = {
      callInitNew: InitHelpers.initNewDataObject,
      processInstance,
      elementTemplate: dataObject,
      templateClass: DataObjectTemplate,
    }
    return (onlyIfUnexist) ? this.initIfUnexistElement(options) : this.initElement(options)
  }

  initSequenceFlow(
    processInstance: { id: number } | ProcessInstance,
    sequence: ({ id: number } | SequenceFlowTemplate)[],
    onlyIfUnexist: boolean = false,
  ): Promise<SequenceFlowInstance[]> {
    let options = {
      callInitNew: InitHelpers.initNewSequenceFlow,
      processInstance,
      elementTemplate: sequence,
      templateClass: SequenceFlowTemplate,
    }
    return (onlyIfUnexist) ? this.initIfUnexistElement(options) : this.initElement(options)
  }

  // TODO Nejtezsi funkce ;( nevim si rady
  async initNextNodes(options: {
    processInstance: { id: number } | ProcessInstance,
    selectedSequenceFlows: (number | { id: number } | SequenceFlowTemplate)[],
  }) {
    // [ ] Ziskat cilove uzly ze sekvence
    // [ ] Inicializovat cilove uzly pokud neexistuji
    // [ ] ...
    const {
      processInstance,
      selectedSequenceFlows,
    } = options

    // ziskat vsechny cile (uzly) pro vsechny sablony spoju
    let sequences = await Promise.all(selectedSequenceFlows.map(async seq => {
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

    // let x = await Promise.all(tasks.map(task => {
    //   switch (task.class) {
    //     case TaskTemplate.name:
    //       return this.initTask(processInstance, [task])
    //     case ScriptTaskTemplate.name:
    //       return this.initScriptTask(processInstance, [task])
    //   }
    //   return undefined
    // }))
    // let y = x.reduce((acc: BasicTaskInstance[], task)=>{
    //   return (task)?[...acc, ...task]: acc
    // }, [])

    // Vytvorit a ulozit instance pro ziskane ulohy.
    let tasksI = await Promise.all(tasks.map(task => {
      switch (task.class) {
        case TaskTemplate.name:
          return this.initTask(processInstance, [task])
        case ScriptTaskTemplate.name:
          return this.initScriptTask(processInstance, [task])
      }
      return Promise.resolve(undefined)
    }))
    let eventsI = await Promise.all(events.map(event => {
      switch (event.class) {
        case StartEventTemplate.name:
          return this.initStartEvent(processInstance, [event])
        case EndEventTemplate.name:
          return this.initEndEvent(processInstance, [event])
      }
      return Promise.resolve(undefined)
    }))
    let gatewaysI = await Promise.all(gateways.map(gate => {
      return this.initGateway(processInstance, [gate])
    }))

  }

  async initNext(
    options: {
      processInstance: { id: number } | ProcessInstance,
      selectedSequenceFlows: (number | { id: number } | SequenceFlowTemplate)[],
      possibleSequenceFlows: (number | { id: number } | SequenceFlowTemplate)[],
    }
  ) {
    // [x] Normalizovat vstupni sequenceFlows.id
    // [x] Overit zda vybrane existuji v moznych
    // [x] Inicializovat instance seqenci pokud neexistuji
    // [ ] Inicializovat instance uzlu (cil seqenci) pokud neexistuji
    const {
      processInstance,
      selectedSequenceFlows,
      possibleSequenceFlows,
    } = options

    let normSelected = selectedSequenceFlows.map(seq => typeof seq === 'number' ? { id: seq } : seq)
    let normPossibleIds = possibleSequenceFlows.map(seq => typeof seq === 'number' ? seq : seq.id)

    let filteredSelected = normSelected.filter(seq => normPossibleIds.includes(seq.id))

    // Instance sequenceFlow
    let sequenceFlowInstances = await this.initSequenceFlow(processInstance, filteredSelected, true)

    sequenceFlowInstances = await this.saveElement([...new Set(sequenceFlowInstances)])

    // TODO vytvoreni instanci uzlu

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
