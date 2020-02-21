import { Connection, Equal, In } from 'typeorm'

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
import { JsonMap } from '../types/json'
import { convertTemplate2Instance } from '../utils/entityHelpers'
import { getInstance, getTemplate } from './anotherHelpers'
import { executeNode } from './executeHelpers'
import * as InitHelpers from './initHelpers'
import { LibrariesWithNodeImplementations, NodeImplementation } from './pluginNodeImplementation'
import { createContextForNode, createEmptyContext, loadContextForNodeElement } from './runContext'


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
    if (elementTemplate.length <= 0) {
      return []
    }

    let processI = await getInstance({
      instanceClass: ProcessInstance,
      entityOrId: processInstance,
      typeormConnection: this.connection,
    })
    let elementIs = await Promise.all(elementTemplate.map(async entityOrId => {
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
    if (elementTemplate.length <= 0) {
      return []
    }
    const instanceClass = convertTemplate2Instance(templateClass)
    if (instanceClass) {
      let instanceRepo = await this.connection.getRepository(instanceClass as Constructor<FlowElementInstance>)

      let elementIds = elementTemplate.map(e => e.id)
      // Najde vsechny instance elementu
      let result = await instanceRepo.find({
        processInstanceId: processInstance.id,
        templateId: In(elementIds),
      })
      let resultIds = result.map(r => r.templateId)

      let tmpMatrixWithElementInstance = await Promise.all(elementTemplate.map(template => {
        let isIn = resultIds.includes(template.id)
        return (isIn) ? [] : this.initElement({
          ...options,
          elementTemplate: [template],
        })
      }))
      let elementInstances = tmpMatrixWithElementInstance.reduce((acc, value) => {
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

    if (selectedSequenceFlows.length <= 0) {
      return []
    }

    let selectedSequences = await Promise.all(selectedSequenceFlows.map(seq => getTemplate({
      typeormConnection: this.connection,
      entityOrId: seq,
      templateClass: SequenceFlowTemplate,
      relations: ['target'],
    })))

    let nodeTemplates = selectedSequences.map(seq => seq.target).filter(s => !!s) as NodeElementTemplate[]
    let nodeTemplateIds = nodeTemplates.map(node => node.id as number)

    // Ziskani existujicich cekajicich uzlu spadajici pod danou instanci procesu
    let waitingNodeInstances = await this.connection.getRepository(NodeElementInstance).find({
      processInstanceId: processInstance.id,
      status: ActivityStatus.Waiting,
      templateId: In(nodeTemplateIds),
    })
    // Zmena z cekajici na pripraveny
    waitingNodeInstances = waitingNodeInstances.map(node => {
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
    },
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
    console.error(JSON.stringify(filteredSelected, null, 2 ))
    if (filteredSelected.length <= 0) {
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

  // [ ] Vzit instanci uzlu z fronty X
  // [x] Najit implementaci uzlu
  //    [x] Pokud neexistuje vyhod chybu
  // [x] Vytvo5it kontext pro uzel
  //    [x] incoming: [{idSeq: int, came: bool}, ...]
  //    [x] outgoing: [{idTargetNode: int, expression: string, flag: string}]
  // [x] Poskladat dodatky/argumenty pro uzel
  //    [x] Nacist data ze sablony uzlu
  //    [x] Nacist data z instance uzlu
  //    [x] Spojit data ze sablony, instance a jine.
  // [ ] Spustit instanci uzlu
  //    [x] prerun
  //    [x] run
  //    [x] oncomplete
  //    [x] onfailling
  //    [ ] osetreni vsech vyjimek zpusobenych implementaci
  // [ ] Ulozit vystupni data
  //    [ ] Ziskej instance datovych objekt; pokud existuji
  //    [ ] Neexistuje instance datoveho objektu, tak ji vytvo5
  //    [ ] Prochazet vzstupni data v kontextu (obj key = dT name)
  // [ ] Ukoncuje uzel proces?
  //    [ ] Ukoncuje nasilne? (Neceka se na dokonceni ostatnich)
  //        [ ] Ano:
  //            [ ] Nastav proces jako ukonceny
  //            [ ] U vsech existujicich instanci uzlu nastav stav jako preruseny
  //            (Ready, Waiting -> Widraw) -> Zmena se musi projevit ve fronte X
  //        [ ] Ne:
  //            [ ] Kontrola zda existuje jina aktivni instance v procesu.
  //            [ ] Existuje: tak pokracovat dal.
  //            [ ] Neexistuje: Ukoncist proces.
  // [ ] Spusti uzel dalsi uzly?
  //    [ ] Ziskat sablonu uzlu
  //    [ ] Ziskat implementaci uzlu
  //    [ ] Vyhodnotit podminky stanovene v nastaveni implementace
  //    [ ] Vytvorit ci najit instanci uzlu a nastavit status na ready
  //        [ ] Vlozit instance do fronty Y
  //    [ ] Vytvorit instance sekvenci seqI(seqT, sourceNodeI, targetNodeI)
  // [ ] Ulozit vse do databaze
  // [ ] Naplanovat zpracovani dalsich uzlu
  //    [ ] Uzly z fronty Y do fronty X
  //
  async runIt(elementInstance: FlowElementInstance, args?: any) {

  }
  async runNode(options: {
    instance: FlowElementInstance,
    args?: JsonMap,
  }) {
    //#region Find and load data from DB.

    let nodeInstance = await this.connection.manager.findOneOrFail(NodeElementInstance, {
      relations: [
        'template',
          'template.incoming', 'template.outgoing',
          'template.inputs', 'template.outputs',
        'processInstance',
          'processInstance.processTemplate',
      ],
      where: {
        id: options.instance.id
      }
    })
    if (!nodeInstance.template) throw new Error('Instance uzelu nema sablonu')
    let nodeTemplate = nodeInstance.template
    if(!nodeTemplate.incoming) throw new Error('Sablona uzelu nema vstupni seqence')
    let incomingSequenceTemplates = nodeTemplate.incoming
    if (!nodeTemplate.outgoing) throw new Error('Sablona uzelu nema vystupni seqence')
    let outgoingSequenceTemplates = nodeTemplate.outgoing
    if (!nodeTemplate.inputs) throw new Error('Sablona uzelu nema vstupni data')
    let inputsDataTemplates = nodeTemplate.inputs
    if (!nodeTemplate.outputs) throw new Error('Sablona uzelu nema vystupni data')
    let outputsDataTemplates = nodeTemplate.outputs
    if (!nodeInstance.processInstance) throw new Error('Instance uzelu nema instanci procesu')
    let processInstance = nodeInstance.processInstance
    if (!processInstance.processTemplate) throw new Error('Instance procesu nema sablonu procesu')
    let processTemplate = processInstance.processTemplate


    let inputsDataInstances: DataObjectInstance[] = []
    if (inputsDataTemplates.length > 0) {
      let templatesIds = inputsDataTemplates.map(d => d.id)
      inputsDataInstances = await this.connection.getRepository(DataObjectInstance).find({
        processInstanceId: Equal(processInstance.id),
        templateId: In([...templatesIds]),
      })
    }
    let outputsDataInstances: DataObjectInstance[] = []
    if (outputsDataTemplates.length > 0) {
      let templatesIds = outputsDataTemplates.map(d => d.id)
      outputsDataInstances = await this.connection.getRepository(DataObjectInstance).find({
        processInstanceId: Equal(processInstance.id),
        templateId: In([...templatesIds]),
      })
    }
    let incomingSequenceInstances: SequenceFlowInstance[] = []
    if (incomingSequenceTemplates.length > 0) {
      // sekvence ktere prichazi do aktuani instance uzlu
      let templatesIds = incomingSequenceTemplates.map(d => d.id)
      incomingSequenceInstances = await this.connection.getRepository(SequenceFlowInstance).find({
        // processInstanceId: Equal(processInstance.id),
        templateId: In([...templatesIds]),
        targetId: Equal(nodeInstance.id),
      })
    }

    //#endregion

    // Nalezt implementaci
    let implementation = this.getImplementation(nodeTemplate.implementation as string)

    // Sestavit kontext
    let context = createEmptyContext()
    context = createContextForNode({
      context,
      nodeTemplate,
      nodeInstance,
      incomingSequenceTemplates,
      incomingSequenceInstances,
      outgoingSequenceTemplates,
      inputsDataTemplates,
      inputsDataInstances,
      outputsDataTemplates,
      outputsDataInstances,
    })

    // Sestavit dodatky/argumenty
    let allArgs = this.createAdditionsArgs({
      nodeTemplate,
      nodeInstance,
      otherArgs: options.args,
    })

    // Spustit uzel
    let results = executeNode({
      nodeInstance,
      args: allArgs,
      context,
      nodeImplementation: implementation,
    })

    // Uloz data z results.outputs do DataObject Instance
    // TODO


  }
  getImplementation(name: string): NodeImplementation {
    let implementation = this.pluginsWithImplementations[name]
    if (typeof implementation !== 'object') {
      throw new Error(`Implementace ulohy '${name}' nenalezena.`)
    }
    return implementation
  }
  createAdditionsArgs(options:{
    nodeTemplate?: NodeElementTemplate,
    nodeInstance?: NodeElementInstance,
    otherArgs?: JsonMap
  }): JsonMap {
    const { nodeInstance, nodeTemplate, otherArgs } = options
    let instanceArgs: JsonMap = {}, templateArgs: JsonMap = {}, someArgs: JsonMap = {}
    if (typeof nodeTemplate === 'object' && typeof nodeTemplate.data === 'object') {
      instanceArgs = nodeTemplate.data
    }
    if (typeof nodeInstance === 'object' && typeof nodeInstance.data === 'object') {
      instanceArgs = nodeInstance.data
    }
    if (typeof otherArgs === 'object') {
      instanceArgs = otherArgs
    }

    return { ...templateArgs, ...instanceArgs,  ...someArgs }
  }


  async runNodeElement(options: {
    nodeInstance: NodeElementInstance,
    nodeArgs: JsonMap,
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

    const { nodeInstance, nodeArgs } = options


    let nodeTemplate = await getTemplate({
      templateClass: NodeElementTemplate,
      entityOrId: nodeInstance.template || { id: nodeInstance.templateId as number },
      typeormConnection: this.connection,
      relations: ['outgoing'],
    })
    let implementation = this.pluginsWithImplementations[nodeTemplate.implementation as string]
    if (typeof implementation !== 'object') {
      throw new Error(`Implementace ulohy '${nodeTemplate.implementation}' nenalezena.`)
    }

    // console.log('1111111111', nodeInstance)
    let context = await loadContextForNodeElement(
      { id: nodeInstance.id as number },
      this.connection,
    )
    // console.log('222222222', nodeTemplate)

    let possibleSequenceFlows: SequenceFlowTemplate[] =
      (nodeTemplate.outgoing) ? nodeTemplate.outgoing : []
    // console.log('33333333')

    let args = {
      ...nodeTemplate.data,
      ...nodeArgs,
    }

    try {
      let results = executeNode({
        nodeInstance,
        args,
        context,
        nodeImplementation: implementation,
      })
      nodeInstance.endDateTime = new Date()

      if (results.finishProcess.finished) {
        if (results.finishProcess.forced) {
          // ukonci process a vsechny instance Ready a Waiting zmeni na Withdrawn.

        } else {
          // Pokud existuji instance Read nebo Waiting tak nedelej nic.
          // V opacnen pripade ukonci process.
        }
        // Ulozeni ukonceneho procesu.
      } else {
        // Proces nebude ukoncen, tak vytvor nasledniky.
        let xxx = await this.initNext({
          processInstance: {id: nodeInstance.processInstanceId},
          selectedSequenceFlows: [...results.initNext],
          possibleSequenceFlows,
        })
      }
    } catch (e) {
      // TODO Osetrit vyjimky.
      console.error('runBasicTask:', e)
    }

    // Uloz instanci ktera prosla zpracovanim
    await this.connection.manager.save(nodeInstance)
  }

  //#endregion

}
