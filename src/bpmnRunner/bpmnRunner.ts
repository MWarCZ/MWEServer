import { Connection, In } from 'typeorm'

import {
  exclusiveGatewayImplementation,
  inclusiveGatewayImplementation,
  parallelGatewayImplementation,
} from '../bpmnRunnerPlugins/gateway'
import { scriptTaskImplementation } from '../bpmnRunnerPlugins/scriptTask'
import { startEventImplementation } from '../bpmnRunnerPlugins/startEvent'
import { taskImplementation } from '../bpmnRunnerPlugins/task'
import {
  ActivityStatus,
  DataObjectInstance,
  DataObjectTemplate,
  FlowElementInstance,
  FlowElementTemplate,
  NodeElementInstance,
  NodeElementTemplate,
  ProcessInstance,
  ProcessTemplate,
  SequenceFlowInstance,
  SequenceFlowTemplate,
} from '../entity/bpmn'
import { Constructor } from '../types/constructor'
import { convertTemplate2Instance } from '../utils/entityHelpers'
import { getInstance, getTemplate } from './anotherHelpers'
import { executeNode } from './executeHelpers'
import * as InitHelpers from './initHelpers'
import { LibrariesWithNodeImplementations } from './pluginNodeImplementation'
import { loadContextForNodeElement } from './runContext'


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
      exclusiveGateway: exclusiveGatewayImplementation,
      inclusiveGateway: inclusiveGatewayImplementation,
      parallelGateway: parallelGatewayImplementation,
      startEvent: startEventImplementation,
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

    // Neni co lulozit
    if (elementTemplate.length<=0) {
      return []
    }

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
    // Neni nic k ulozeni
    if (elementTemplate.length<=0) {
      return []
    }
    const instanceClass = convertTemplate2Instance(templateClass)
    if (instanceClass) {
      let instanceRepo = await this.connection.getRepository(instanceClass as Constructor<FlowElementInstance>)

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
        return [...acc, ...value]
      })
      return elementInstances
    }
    return []
  }

  async initAndSaveProcess(
    processTemplate: { id: number } | ProcessTemplate,
    startEvent: { id: number } | NodeElementTemplate,
  ): Promise<ProcessInstance> {
    // Vyhledani sablon
    let processT = await getTemplate({
      templateClass: ProcessTemplate,
      entityOrId: processTemplate,
      typeormConnection: this.connection,
    })
    let startEventT = await getTemplate({
      templateClass: NodeElementTemplate,
      entityOrId: startEvent,
      typeormConnection: this.connection,
    })

    // Vytvoreni instance procesu
    let processInstance = InitHelpers.initNewProcess(processT)
    processInstance = await this.connection.manager.save(processInstance)

    // Vytvoreni instance prvniho startovaciho eventu
    let startEventI = await this.initNodeElement(processInstance, [startEventT])
    startEventI = await this.saveElement(startEventI)

    return processInstance
  }

  initNodeElement(
    processInstance: { id: number } | ProcessInstance,
    nodeElement: ({ id: number } | NodeElementTemplate)[],
    onlyIfUnexist: boolean = false,
  ): Promise<NodeElementInstance[]> {
    let options = {
      callInitNew: InitHelpers.initNewNodeElement,
      processInstance,
      elementTemplate: nodeElement,
      templateClass: NodeElementTemplate,
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
    selectedSequenceFlows: ({ id: number } | SequenceFlowTemplate)[],
  }) {
    // [x] Ziskat cilove uzly ze sekvence
    // [x] Ziskat existujici cilove uzly s status Waiting a nastavit na Ready
    // [x] Inicializovat cilove uzly pokud neexistuji
    // [x] Vratit vsechny cilove uzli (existujici i nove inicializovane)
    const {
      processInstance,
      selectedSequenceFlows,
    } = options

    if(selectedSequenceFlows.length<=0){
      return []
    }

    let selectedSequences = await Promise.all(selectedSequenceFlows.map(seq=>getTemplate({
      typeormConnection: this.connection,
      entityOrId: seq,
      templateClass: SequenceFlowTemplate,
      relations: ['target'],
    })))

    let nodeTemplates = selectedSequences.map(seq => seq.target).filter(s => !!s) as NodeElementTemplate[]
    let nodeTemplateIds = nodeTemplates.map(node=>node.id as number)

    // Ziskani existujicich cekajicich uzlu spadajici pod danou instanci procesu
    let waitingNodeInstances = await this.connection.getRepository(NodeElementInstance).find({
      processInstanceId: processInstance.id,
      status: ActivityStatus.Waiting,
      templateId: In(nodeTemplateIds),
    })
    // Zmena z cekajici na pripraveny
    waitingNodeInstances = waitingNodeInstances.map(node=>{
      node.status = ActivityStatus.Ready
      return node
    })
    // Vytvorit neexistujici instance uzlu
    let newNodeInstances = await this.initNodeElement(processInstance, nodeTemplates, true)

    return [...newNodeInstances, ...waitingNodeInstances]
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
    // [ ] Inicializovat cilove uzly sekvenci
    //    [ ] Inicializovat neexistujici
    //    [ ] Existujici se status==Waiting zmenit na Ready
    const {
      processInstance,
      selectedSequenceFlows,
      possibleSequenceFlows,
    } = options

    let normSelected = selectedSequenceFlows.map(seq => typeof seq === 'number' ? { id: seq } : seq)
    let normPossibleIds = possibleSequenceFlows.map(seq => typeof seq === 'number' ? seq : seq.id)

    let filteredSelected = normSelected.filter(seq => normPossibleIds.includes(seq.id))
    if(filteredSelected.length<=1) {
      return []
    }

    // Instance vsech novych sequenceFlow pokud neexistuji
    let sequenceFlowInstances = await this.initSequenceFlow(processInstance, filteredSelected, true)
    // Ulozeni techto instanci
    sequenceFlowInstances = await this.saveElement([...new Set(sequenceFlowInstances)])

    // vytvoreni instanci uzlu
    let nodeInstances = await this.initNextNodes({
      processInstance,
      selectedSequenceFlows: filteredSelected,
    })
    nodeInstances = await this.saveElement([...new Set(nodeInstances)])

    return nodeInstances
  }

  //#endregion


  //#region Funkce RunXXX, ExecuteXXX

  // ExecuteXXX - synchronni funkce
  // RunXXX - asynchronni funkce

  async runIt(elementInstance: FlowElementInstance, args?: any) {
    // if (elementInstance instanceof StartEventInstance) {

    // } else if (elementInstance instanceof EndEventInstance) {

    // } else if (elementInstance instanceof GatewayInstance) {

    // } else if (elementInstance instanceof BasicTaskInstance) {
    //   await this.runBasicTask({
    //     taskInstance: elementInstance,
    //     taskArgs: args,
    //   })
    // } else {
    //   throw new Error('Neznamou instanci nelze spustit.')
    // }
  }


  async runNodeElement(options: {
    taskInstance: NodeElementInstance,
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
      templateClass: NodeElementTemplate,
      entityOrId: taskInstance.template || { id: taskInstance.templateId as number },
      typeormConnection: this.connection,
      relations: ['outgoing'],
    })
    let implementation = this.pluginsWithImplementations[taskTemplate.implementation as string]
    if (typeof implementation !== 'object') {
      throw new Error(`Implementace ulohy '${taskTemplate.implementation}' nenalezena.`)
    }

    console.log('1111111111', taskInstance)
    let context = await loadContextForNodeElement(
      { id: taskInstance.id as number },
      this.connection,
    )

    let possibleSequenceFlows: SequenceFlowTemplate[] =
      (taskTemplate.outgoing) ? taskTemplate.outgoing : []
    console.log('222222222')

    try {
      let results = executeNode({
        nodeInstance: taskInstance,
        args: taskArgs,
        context,
        nodeImplementation: implementation,
      })
      let xxx = await this.initNext({
        processInstance: {id:1},
        selectedSequenceFlows: [...results.initNext],
        possibleSequenceFlows,
      })
      console.warn({xxx})
    } catch (e) {
      // TODO Osetrit validni vyjimky.
      console.error('runBasicTask:', e)
    }

    // Uloz instanci ktera prosla zpracovanim
    await this.connection.manager.save(taskInstance)
  }

  //#endregion

}
