///////////////////////////////////////
// Soubor: src/bpmnRunner/bpmnRunner.ts
// Projekt: MWEServer
// Autor: Miroslav Válka
///////////////////////////////////////
import { Connection, Equal, In } from 'typeorm'

import { EndEvent } from '../bpmnRunnerPlugins/endEvent'
import { ExclusiveGateway, InclusiveGateway, ParallelGateway } from '../bpmnRunnerPlugins/gateway'
import { LinkIntermediateCatchEvent, LinkIntermediateThrowEvent } from '../bpmnRunnerPlugins/linkIntermediateEvent'
import { ManualTask } from '../bpmnRunnerPlugins/manualTask'
import { ScriptTask } from '../bpmnRunnerPlugins/scriptTask'
import { StartEvent } from '../bpmnRunnerPlugins/startEvent'
import { Task } from '../bpmnRunnerPlugins/task'
import { TerminateEndEvent } from '../bpmnRunnerPlugins/terminateEndEvent'
import { UserTask } from '../bpmnRunnerPlugins/userTask'
import { User } from '../entity'
import {
  ActivityStatus,
  DataObjectInstance,
  DataObjectTemplate,
  FlowElementInstance,
  FlowElementTemplate,
  NodeElementInstance,
  NodeElementTemplate,
  ProcessInstance,
  ProcessStatus,
  ProcessTemplate,
  SequenceFlowInstance,
  SequenceFlowTemplate,
} from '../entity/bpmn'
import { Constructor } from '../types/constructor'
import { JsonMap } from '../types/json'
import { convertTemplate2Instance } from '../utils/entityHelpers'
import { getInstance, getTemplate } from './anotherHelpers'
import { executeAdditons, executeNode, TopLevelExecuteFunctionArgs } from './executeHelpers'
import * as InitHelpers from './initHelpers'
import { DataRegister, FinishProcess, IDsCollector } from './plugins'
import {
  LibrariesWithNodeImplementations,
  LibrariesWithServiceImplementations,
  NodeImplementation,
} from './pluginsImplementation'
import { convertToProvideNodes, createContextForNode, createEmptyContext, RunContextProvideNodes } from './runContext'
import { SupportedNode } from './supportedNode'

/**
 * Vychozi knihovna obsahujici implementace uzlu
 * tj. zasuvne moduly s implementaci uzlu a prideleni jejich jmen k identifikaci uzlem.
*/
export const DefaultPluginsWithNodeImplementations: LibrariesWithNodeImplementations = {
  [SupportedNode.Task]: Task,
  [SupportedNode.ScriptTask]: ScriptTask,
  [SupportedNode.ManualTask]: ManualTask,
  [SupportedNode.UserTask]: UserTask,

  [SupportedNode.ExclusiveGateway]: ExclusiveGateway,
  [SupportedNode.InclusiveGateway]: InclusiveGateway,
  [SupportedNode.ParallelGateway]: ParallelGateway,

  [SupportedNode.StartEvent]: StartEvent,

  [SupportedNode.EndEvent]: EndEvent,
  [SupportedNode.TerminateEndEvent]: TerminateEndEvent,

  [SupportedNode.LinkIntermediateCatchEvent]: LinkIntermediateCatchEvent,
  [SupportedNode.LinkIntermediateThrowEvent]: LinkIntermediateThrowEvent,
}

/** Vychozi knihovna s implementacemi sluzeb */
export const DefaultPluginsWithServiceImplementations: LibrariesWithServiceImplementations = [
  new IDsCollector({
    name: 'initNext',
  }),
]

/** Datovy typ pro ucely nacteni vsech potrebnych dat z databare a jejich predani. */
export interface LoadedData {
  nodeInstance: NodeElementInstance,
  nodeTemplate: NodeElementTemplate,
  incomingSequenceTemplates: SequenceFlowTemplate[],
  outgoingSequenceTemplates: SequenceFlowTemplate[],
  inputsDataTemplates: DataObjectTemplate[],
  outputsDataTemplates: DataObjectTemplate[],
  processInstance: ProcessInstance,
  processTemplate: ProcessTemplate,
  inputsDataInstances: DataObjectInstance[],
  outputsDataInstances: DataObjectInstance[],
  incomingSequenceInstances: SequenceFlowInstance[],
  outgoingSequenceInstances: SequenceFlowInstance[],
  nodeTemplates: NodeElementTemplate[],
  nodeInstances: NodeElementInstance[],
}

/** Datovy objekt pro ulozeni zmenenych ci vytvorenych entit */
export interface SaveData {
  nodeInstance: NodeElementInstance,
  outputsDataInstances: DataObjectInstance[],
  targetNodeInstances: NodeElementInstance[],
  targetSequenceInstances: SequenceFlowInstance[],
  processInstance: ProcessInstance,
}

/** Datovy objekt pro ulozeni zmenenych ci vytvorenych entit po stahnuti instance procesu */
export interface SaveDataAfterWithdrawn {
  processInstance: ProcessInstance,
  targetNodeInstances: NodeElementInstance[],
}

/**
 * Výchozí maximální počet opakování vytváření instance z jedné sablony uzlu
 * v ramci instance procesu.
 */
const MAX_COUNT_RECURRENCE_NODE = 10

/**
 * Hlavni behove jadro procesu slouzi ke zpracovavani instanci uzlu.
 */
export class BpmnRunner {
  /** Pripojeni k databazi */
  connection: Connection
  /** Knihovna s implementacemi uzlu */
  pluginsWithImplementations: LibrariesWithNodeImplementations
  /** Knihovna s implementacemi sluzeb */
  pluginsWithServices: LibrariesWithServiceImplementations
  /** Systemovy uzivatel, ktery obsluhuje instance ve vychozim stavu */
  systemUser?: User

  constructor(
    connection: Connection,
    pluginsWithImplementations?: LibrariesWithNodeImplementations,
    pluginsWithServices?: LibrariesWithServiceImplementations,
    systemUser?: User,
  ) {
    this.connection = connection

    if (typeof pluginsWithImplementations === 'object') {
      this.pluginsWithImplementations = {
        ...pluginsWithImplementations,
      }
    } else {
      this.pluginsWithImplementations = {
        ...DefaultPluginsWithNodeImplementations,
      }
    }
    if (Array.isArray(pluginsWithServices)) {
      this.pluginsWithServices = pluginsWithServices
    } else {
      this.pluginsWithServices = []
    }
    this.systemUser = systemUser
  }

  //#region Funkce InitXXX - Kontrola, vytvoreni instance, ulozeni instance.
  /** Vytvoreni instance elementu */
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
  /** Ulozeni instance elementu do databaze */
  async saveElement<I extends FlowElementInstance | FlowElementInstance[]>(
    elementI: I,
  ): Promise<I> {
    return this.connection.manager.save(elementI)
  }
  /** Vytvoreni nove instance elementu a nasledne ulozeni do databaze */
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
  /** Funkce pro vytvoreni nove instance ze sablony pokud jeste neexistuje */
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

  /** Vytvoreni nove instance procesu a jeji prvni instance uzlu a nasledne ulozeni do databaze */
  async initAndSaveProcess(
    processTemplate: { id: number } | ProcessTemplate,
    startEvent: { id: number } | NodeElementTemplate,
  ): Promise<{ process: ProcessInstance, node: NodeElementInstance}> {
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

    InitHelpers.checkIsElementInsideProcess(
      processT,
      startEventT,
      NodeElementTemplate,
    )

    processInstance = await this.connection.manager.save(processInstance)

    // Vytvoreni instance prvniho startovaciho eventu
    let startEventI = await this.initNodeElement(processInstance, [startEventT])
    startEventI = await this.saveElement(startEventI)

    return {
      process: processInstance,
      node: startEventI[0],
    }
  }

  /** Vytvoreni instance uzlu */
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

  /** Vytvoreni instance datoveho objektu */
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

  /** Vytvoreni instance sekvencniho toku */
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

  //#endregion

  //#region Pomocne funkci na praci s db

  /**
   * Nacteni vsech entit potrebnych ke zpracovani instance uzlu z databaze.
   */
  async loadDataForRun(options: {
    instance: NodeElementInstance | { id: number },
  }): Promise<LoadedData> {

    // Nacteni instance uzlu a vsech informaci okolo
    let nodeInstance = await this.connection.manager.findOneOrFail(NodeElementInstance, {
      relations: [
        'assignee',
        'template',
        'template.incoming',
        'template.outgoing',
        'template.inputs',
        'template.outputs',
        'processInstance',
        'processInstance.nodeElements',
        'processInstance.processTemplate',
        'processInstance.processTemplate.nodeElements',
      ],
      where: {
        id: options.instance.id,
      },
    })

    //#region Rozbiti velkeho ziskaneho objektu na male objekty

    // 1) Overit zda polozka existuje.
    // 2) Ulozit objekt v polozce do samostatne promenne.
    // 3) Odstranit polozku z puvodniho objektu.
    //    Proc? Problem pri ukladani -> vyrazne zretezeni zpusobuje problemy.
    if (!nodeInstance.template) { throw new Error('Instance uzelu nema sablonu') }
    let nodeTemplate = nodeInstance.template
    delete nodeInstance.template
    if (!nodeTemplate.incoming) { throw new Error('Sablona uzelu nema vstupni seqence') }
    let incomingSequenceTemplates = nodeTemplate.incoming
    delete nodeTemplate.incoming
    if (!nodeTemplate.outgoing) { throw new Error('Sablona uzelu nema vystupni seqence') }
    let outgoingSequenceTemplates = nodeTemplate.outgoing
    delete nodeTemplate.outgoing
    if (!nodeTemplate.inputs) { throw new Error('Sablona uzelu nema vstupni data') }
    let inputsDataTemplates = nodeTemplate.inputs
    delete nodeTemplate.inputs
    if (!nodeTemplate.outputs) { throw new Error('Sablona uzelu nema vystupni data') }
    let outputsDataTemplates = nodeTemplate.outputs
    delete nodeTemplate.outputs
    if (!nodeInstance.processInstance) { throw new Error('Instance uzelu nema instanci procesu') }
    let processInstance = nodeInstance.processInstance
    delete nodeInstance.processInstance
    if (!processInstance.processTemplate) { throw new Error('Instance procesu nema sablonu procesu') }
    let processTemplate = processInstance.processTemplate
    delete processInstance.processTemplate

    if (!processTemplate.nodeElements) { throw new Error('Sablona procesu neobsahuje seznam sablon uzlu') }
    let nodeTemplates = processTemplate.nodeElements
    delete processTemplate.nodeElements
    if (!processInstance.nodeElements) { throw new Error('Instance procesu neobsahuje seznam instanci uzlu') }
    let nodeInstances = processInstance.nodeElements
    delete processInstance.nodeElements

    //#endregion

    //#region Ziskani a uprava datovych a instancnich objektu

    // Implementace pro dany uzel => Zjistit nastavene predvolby
    let implementation = this.getImplementation(nodeTemplate.implementation as string)

    // Potrebuji data v globalnim meritku procesu?
    const { scope_inputs, scope_outputs, max_count_recurrence_node = 5 } = implementation.options || {}

    if (scope_inputs === 'global') {
      // Data dostupna v celem procesu jako vstupy
      inputsDataTemplates = await this.connection.manager.find(DataObjectTemplate, {
        processTemplateId: Equal(processTemplate.id),
      })
    }
    if (scope_outputs === 'global') {
      // Data dostupna v celem procesu jako vystupy
      outputsDataTemplates = await this.connection.manager.find(DataObjectTemplate, {
        processTemplateId: Equal(processTemplate.id),
      })
    }


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
    let outgoingSequenceInstances: SequenceFlowInstance[] = []
    if (outgoingSequenceTemplates.length > 0) {
      // sekvence ktere prichazi do aktuani instance uzlu
      let templatesIds = outgoingSequenceTemplates.map(d => d.id)
      outgoingSequenceInstances = await this.connection.getRepository(SequenceFlowInstance).find({
        // processInstanceId: Equal(processInstance.id),
        templateId: In([...templatesIds]),
        targetId: Equal(nodeInstance.id),
      })
    }

    //#endregion
    const result: LoadedData = {
      nodeInstance,
      nodeTemplate,
      incomingSequenceTemplates,
      outgoingSequenceTemplates,
      inputsDataTemplates,
      outputsDataTemplates,
      processInstance,
      processTemplate,
      nodeTemplates,
      nodeInstances,
      inputsDataInstances,
      outputsDataInstances,
      incomingSequenceInstances,
      outgoingSequenceInstances,
    }
    return result
  }

  /**
   * Ulozeni entit po zpracovani do databaze.
   */
  async saveData(result: SaveData) {
    // console.warn('1111111')
    await this.connection.transaction(async(manager) => {
      // console.warn('2222222')
      await manager.save(result.nodeInstance) // aktualni instance
      // console.warn('333333333333')
      await manager.save(result.outputsDataInstances) // Nova data
      // console.warn('444444444')
      await manager.save(result.targetNodeInstances) // Nove pripravene instance uzlu
      // console.warn('5555555555')
      try {
        // console.log('saveData:', result.targetSequenceInstances)
        await manager.save(result.targetSequenceInstances) // Nove pripravene instance seqenci
      } catch { console.error('Problem s ulozenim instance sekvenci.') }
      // console.warn('666666666')
      await manager.save(result.processInstance) // Proces mohl skoncit
      // console.warn('77777777')
    })
    // console.warn('1111111')
  }
  //#endregion

  //#region Pomocne funkce na predpripravu/upravu dat

  /** Pomocna funkce pro ziskani implementace uzlu z knihovny */
  getImplementation(name: string): NodeImplementation {
    let implementation = this.pluginsWithImplementations[name]
    if (typeof implementation !== 'object') {
      throw new Error(`Implementace ulohy '${name}' nenalezena.`)
    }
    return implementation
  }

  /** Slozeni kontextu pro beh zpracovani instance uzlu */
  prepareContext(options: LoadedData) {
    let {
      incomingSequenceInstances,
      inputsDataInstances,
      outgoingSequenceInstances,
      outgoingSequenceTemplates,
      outputsDataTemplates,
      processInstance,
      incomingSequenceTemplates,
      inputsDataTemplates,
      nodeInstance,
      nodeTemplate,
      outputsDataInstances,
      processTemplate,
      nodeTemplates,
      nodeInstances,
    } = options

    // Nalezeni implementace pro dany uzel.
    let implementation = this.getImplementation(nodeTemplate.implementation as string)

    // Chce dostat uzel informace i o jinych uzlech v sablone
    const { provideNodes } = implementation.options || {}
    let provideNodeTemplates: RunContextProvideNodes[] = []
    if (provideNodes) {
      let tmpNodes = convertToProvideNodes({ nodeTemplates })
      provideNodeTemplates = tmpNodes.filter(node => provideNodes(node))
    }

    // Sestaveni kontextu pro dany uzel.
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
      processInstance,
      provideNodeTemplates,
    })
    return context
  }

  /**
   * Uloženi dat ziskanych po zpracovani do instanci datovych objektu.
  */
  storeDataToDataObject(options: {
    dataObject?: JsonMap,
    outputsDataTemplates: DataObjectTemplate[],
    outputsDataInstances: DataObjectInstance[],
    processInstance: ProcessInstance,
  }): DataObjectInstance[] {
    const { dataObject, outputsDataInstances, outputsDataTemplates, processInstance } = options
    if (typeof dataObject !== 'object') return outputsDataInstances

    for (let dataKey in dataObject) {

      let dataTemplate = outputsDataTemplates.find(d => d.name === dataKey)
      // Vystupni objekt daneho jmena nenalezen -> preskoc dal
      if (!dataTemplate) continue

      let dataInstance = outputsDataInstances.find(
        d => d.templateId === (dataTemplate && dataTemplate.id),
      )
      // Instance neexistuje? -> Pokud ne vytvor novou a pridej ji do seznamu instanci
      if (!dataInstance) {
        dataInstance = InitHelpers.initNewDataObject(processInstance, dataTemplate)
        outputsDataInstances.push(dataInstance)
      }

      // V datech nic neni ulozeno - preskoc
      let data = dataObject[dataKey]
      if (typeof data !== 'undefined' && data === null) continue
      dataInstance.data = data
    }

    return outputsDataInstances
  }

  /**
   * Vytvoreni instanci uzlu, ktere maji pokracovat
   * v sekvencim toku, o kterem rozhodla implementace uzlu.
   */
  prepareTargetNodeInstances(options: {
    processInstance: ProcessInstance,
    nodeTemplates: NodeElementTemplate[],
    nodeInstances: NodeElementInstance[],
    unfinishedNodeInstances: NodeElementInstance[],
  }): NodeElementInstance[] {
    const { processInstance, nodeTemplates, unfinishedNodeInstances, nodeInstances } = options

    let result = nodeTemplates.map(nodeTemplate => {
      let nodeInstance = unfinishedNodeInstances.find(n => n.templateId === nodeTemplate.id)
      if (nodeInstance) {
        nodeInstance.status = ActivityStatus.Ready
      } else {
        nodeInstance = InitHelpers.initNewNodeElement(processInstance, nodeTemplate)

        // Test na pocet existujicich instanci
        const targetImplementation = this.getImplementation(nodeTemplate.implementation as string)
        const { max_count_recurrence_node = MAX_COUNT_RECURRENCE_NODE } = targetImplementation.options || {}
        // Spocitani existujicich instanci uzlu
        const count = nodeInstances.filter(instance => instance.templateId === nodeTemplate.id).length
        if (count >= max_count_recurrence_node) {
          nodeInstance.status = ActivityStatus.Failled
          nodeInstance.returnValue = {
            error: {
              name: 'max_count_recurrence_node',
              message: `Implementace '${nodeTemplate.implementation}' povoluje jen '${max_count_recurrence_node}' opakovane vytvorit uzel.`,
            },
          }
        } else {
          nodeInstance.status = ActivityStatus.Ready
        }
      }
      return nodeInstance
    })
    return result
  }
  /**
   * Vytvoreni instanci sekvenci, ktere propojuji zdrojovy uzel s cilovimi uzly
   */
  prepareTargetSequenceInstances(options: {
    outgoingSequenceTemplates: SequenceFlowTemplate[],
    outgoingSequenceInstances: SequenceFlowInstance[],
    targetNodeInstances: NodeElementInstance[],
    sourceNodeInstance: NodeElementInstance,
    processInstance: ProcessInstance,
  }): SequenceFlowInstance[] {
    const {
      outgoingSequenceInstances,
      outgoingSequenceTemplates,
      targetNodeInstances,
      sourceNodeInstance,
      processInstance,
    } = options
    if (targetNodeInstances.length <= 0) return outgoingSequenceInstances
    // Pouze jiz existujici cilove uzly (Do neexistujiciho nemohlo nic vest)
    let targetIds = targetNodeInstances.map(n => n.id).filter(n => !n) as number[]

    let sequenceInstances = outgoingSequenceTemplates.map(sequenceTemplate => {
      // Existuje instance patrici sablone a zaroven ukazujici na cil?
      let sequenceInstance = outgoingSequenceInstances.find(
        seq => seq.templateId === sequenceTemplate.id && targetIds.includes(seq.targetId as number),
      )
      // Neexistuje tak vytvor
      if (!sequenceInstance) {
        // najdi instanci cile => id cile sekvence sablony musi bit stejne jako id instance cile
        let targetNodeInstance = targetNodeInstances.find(targetNode => {
          return (targetNode.templateId === sequenceTemplate.targetId) ||
            (targetNode.template && targetNode.template.id === sequenceTemplate.targetId)
        })
        sequenceInstance = InitHelpers.initNewSequenceFlow(
          processInstance,
          sequenceTemplate,
          { sourceNodeInstance, targetNodeInstance },
        )
      }
      return sequenceInstance
    })
    return sequenceInstances
  }

  //#endregion

  //#region Funkce RunXXX, ExecuteXXX
  /**
   * Hlavni vstupni funkce, ktera obstarava cely proces zpracovani instance uzlu.
   */
  async runIt(options: {
    instance: NodeElementInstance | { id: number },
  }) {
    let data = await this.loadDataForRun(options)

    let result = this.runNode({
      ...data,
    })
    try {
      await this.saveData(result)
    } catch (e) {
      console.error('runIt: Chyba pri ukladani dat.')
      console.error(e)
    }

    return result
  }

  /** Pomocna funkce pro spusteni zpracovani pomoci implementace uzlu */
  runNode(options: LoadedData): SaveData {
    return this.runNodeWithFn({
      data: options,
      executeFn: executeNode,
    })
  }

  /** Hlavni vstupni funkce, ktera obslouzi cely proces ziskani formatu a pozadavku na dodatky */
  async runNodeAdditionsFormat(options: {
    instance: NodeElementInstance | { id: number },
  }) {
    let data = await this.loadDataForRun(options)

    let implementation = this.getImplementation(data.nodeTemplate.implementation as string)

    let context = this.prepareContext(data)

    if (implementation.additionsFormat) {
      let result = implementation.additionsFormat({context})
      return result
    }
    return {}
  }

  /** Hlavni vstupni funkce, ktera obstara cely proces doplneni dodatku do instance uzlu. */
  async runNodeAdditions(options: {
    instance: NodeElementInstance | { id: number },
    additions: JsonMap,
  }) {
    let data = await this.loadDataForRun(options)

    if ([ActivityStatus.Completed].includes(data.nodeInstance.status as ActivityStatus)) {
      throw new Error(`Do uzlu '${data.nodeInstance.status}' neni mozne doplnit nove dodatky.`)
    }
    // Pridani dodatku do uzlu
    data.nodeInstance.data = {
      ...data.nodeInstance.data,
      ...options.additions,
    }

    let result = this.additionsNode({
      ...data,
    })
    await this.saveData(result)

    return result
  }

  /** Pomocna funkce pro spusteni doplnovani dodatku pomoci implementace uzlu */
  additionsNode(options: LoadedData): SaveData {
    return this.runNodeWithFn({
      data: options,
      executeFn: executeAdditons,
    })
  }

  // Funkce obaluje spousteni funkci nad uzly pro zvolene funkce/scenare.
  /** Pomocna funkce ktera obaluje proces pro provedeni implementace uzlu */
  runNodeWithFn(options: {
    data: LoadedData,
    executeFn: (options: TopLevelExecuteFunctionArgs) => any,
  }): SaveData {
    let {
      incomingSequenceInstances,
      inputsDataInstances,
      outgoingSequenceInstances,
      outgoingSequenceTemplates,
      outputsDataTemplates,
      processInstance,
      incomingSequenceTemplates,
      inputsDataTemplates,
      nodeInstance,
      nodeTemplate,
      outputsDataInstances,
      processTemplate,
      nodeTemplates,
      nodeInstances,
    } = options.data

    let implementation = this.getImplementation(nodeTemplate.implementation as string)

    let context = this.prepareContext(options.data)

    let returnValues: {
      // Seznam obsahujici id sequenceFlow, ktere maji byt provedeny.
      initNext: number[],
      // Informace o ukoceni procesu.
      finishProcess: { finished: boolean, forced: boolean, type: string },
      registerGlobal: JsonMap,
      registerLocal: JsonMap,
      outputs?: JsonMap,
    } = {
      initNext: [],
      finishProcess: { finished: false, forced: false, type: '' },
      registerGlobal: {},
      registerLocal: {},
    }

    // Pridani pluginu sluzeb
    let services = [
      ...this.pluginsWithServices,
      new IDsCollector({
        name: 'initNext',
        done: (...ids) => {
          returnValues.initNext.push(...ids)
        },
      }),
      new FinishProcess({
        name: 'finishProcess',
        done: (data) => {
          // returnValues.finishProcess = data
          if (data.finished) {
            returnValues.finishProcess.finished = data.finished
            if (data.forced) {
              returnValues.finishProcess.forced = data.forced
            }
            if (data.type) {
              returnValues.finishProcess.type = data.type
            }
          }
        },
      }),
      new DataRegister({
        name: 'registerGlobal',
        done: (allData, name, newData) => {
          returnValues.registerGlobal = allData
        },
      }),
      new DataRegister({
        name: 'registerLocal',
        done: (allData, name, newData) => {
          returnValues.registerLocal = allData
        },
      }),
    ]

    // Vykonani uzlu nad pripravenymi daty a implementaci.
    let results = options.executeFn({
      nodeInstance,
      context,
      nodeImplementation: implementation,
      services,
    })
    // console.log('BBB:>>', nodeInstance)

    //#region Zpracovani vysledku po vykonani uzlu.

    // Uloz data z results.outputs do DataObject Instance
    outputsDataInstances = this.storeDataToDataObject({
      dataObject: results,
      outputsDataTemplates,
      outputsDataInstances,
      processInstance,
    })

    // results.registerData
    processInstance.data = { ...processInstance.data, ...returnValues.registerGlobal }
    nodeInstance.data = { ...nodeInstance.data, ...returnValues.registerLocal }


    // Najit sablony uzlu, ktere maji byt spusteny dale.
    let targetNodeTemplates = nodeTemplates.filter(
      node => returnValues.initNext.includes(node.id as number),
    )
    // Najit nedokoncene instance uzlu pro dany proces.
    let unfinishedNodeInstances = nodeInstances.filter(
      node => [ActivityStatus.Ready, ActivityStatus.Waiting].includes(node.status as ActivityStatus),
    )
    // Odstraneni prave zpracovavane instance uzlu ze seznamu nedokoncenych instanci uzlu (pokud je dokoncen).
    if (![ActivityStatus.Ready, ActivityStatus.Waiting].includes(nodeInstance.status as ActivityStatus)) {
      unfinishedNodeInstances = unfinishedNodeInstances.filter(node => node.id !== nodeInstance.id)
    }
    // Pripravit instance uzlu pro pristi spusteni.
    let targetNodeInstances = this.prepareTargetNodeInstances({
      processInstance,
      nodeTemplates: targetNodeTemplates,
      unfinishedNodeInstances,
      nodeInstances,
    })
    // Pripravit instance sekvenci, ktere vedou k uzlum pro pristi spusteni.
    let targetSequenceInstances = this.prepareTargetSequenceInstances({
      processInstance,
      sourceNodeInstance: nodeInstance,
      targetNodeInstances,
      outgoingSequenceTemplates,
      outgoingSequenceInstances,
    })
    // console.error(JSON.stringify(targetNodeInstances,null,2))

    // Test zda vsechny vytvarene uzly maji spravny stav.
    targetNodeInstances.find(node => {
      if (node.status === ActivityStatus.Failled) {
        // console.log('T-NI:', node)
        returnValues.finishProcess.finished = true
        returnValues.finishProcess.forced = true
        return true
      }
      return false
    })

    // Ukoncit proces? TODO
    // TODO Zamyslet se nad ukoncovanim procesu
    if (returnValues.finishProcess.finished) {
      if (returnValues.finishProcess.forced) {
        // console.error('Proces byl nasilne ukoncen.')
        // console.error(processInstance)
        // console.error(targetNodeInstances)
        // console.error(targetSequenceInstances)
        // Ukoncit proces a vsechny cekajici a pripravene uzly
        processInstance.status = ProcessStatus.Terminated
        // Ukoncit pripravene/cekajici uzly
        targetNodeInstances = unfinishedNodeInstances.map(node => {
          node.status = ActivityStatus.Withdrawn
          return node
        })
        processInstance.endDateTime = new Date()
      } else {
        // Ukonci proces kdyz:
        // Neexistuje cekajici/pripraveny uzel a ani nebyl pripraven zadny novy uzel.
        if (unfinishedNodeInstances.length === 0 && targetNodeInstances.length === 0) {
          processInstance.status = ProcessStatus.Completed
          processInstance.endDateTime = new Date()
        }
        // Jinak pokracuje proces pokracuje dale
        else {
          processInstance.status = ProcessStatus.Active
        }
      }

    } else {
      // Neni konec, ale jiz neni co dale vykonat => proces konci chybou
      if (unfinishedNodeInstances.length === 0 && targetNodeInstances.length === 0) {
        processInstance.status = ProcessStatus.Failled
        processInstance.endDateTime = new Date()
        processInstance.data = {
          ...processInstance.data,
          error: {
            name: 'unexist_another_node_instances',
            message: `V instanci procesu neexistují jiné instance uzlů, které by mohly být zpracovány.`,
          },
        }
      }
      else {
        processInstance.status = ProcessStatus.Active
      }
    }
    //#endregion

    if ([ActivityStatus.Completed, ActivityStatus.Failled].includes(nodeInstance.status as ActivityStatus)) {
      if (!nodeInstance.assignee && this.systemUser) {
        nodeInstance.assignee = this.systemUser
      }
    }
    // console.log('CCC:>>', nodeInstance)

    let result: SaveData = {
      nodeInstance,
      outputsDataInstances,
      targetNodeInstances,
      targetSequenceInstances,
      processInstance,
    }
    return result
  }

  //#endregion

  //#region Funkce pro meneni sta

  /**
   * Hlavni vstupni funkce, ktera obstarava stazeni instance procesu.
   */
  async runProcessWidhrawn(options: {
    processInstance: ProcessInstance | { id: number },
    fn: (x: any) => SaveDataAfterWithdrawn,
    status: {
      process?: ProcessStatus,
    },
  }) {
    let processInstance = await this.connection.manager.findOne(ProcessInstance, {
      relations: ['nodeElements'],
      where: {
        id: options.processInstance.id,
      },
    })
    if (processInstance) {

      if ([ProcessStatus.Completed, ProcessStatus.Failled, ProcessStatus. Terminated].includes(processInstance.status)) {
        throw new Error('Neni mozne prerusit dany proces.')
      }

      let nodeInstances = (processInstance.nodeElements) ? processInstance.nodeElements : []
      delete processInstance.nodeElements
      let result = options.fn({
        processInstance,
        nodeInstances,
        status: options.status,
      })
      await this.connection.transaction(async manager => {
        await manager.save(result.processInstance)
        await manager.save(result.targetNodeInstances)
      })
      return result
    }
    return null
  }

  /**
   * Hlavni vstupni funkce, ktera obstarava navraceni stazene instance procesu.
   */
  processUniversalWithdrawn(options: {
    processInstance: ProcessInstance,
    nodeInstance?: NodeElementInstance,
    nodeInstances: NodeElementInstance[],
    status: {
      process?: ProcessStatus,
      node?: ActivityStatus,
      nodes?: ActivityStatus[],
    },

  }): SaveDataAfterWithdrawn {
    const { status, processInstance, nodeInstances, nodeInstance } = options

    if (status.process) {
      processInstance.status = status.process
    }
    if (status.node) {
      const potencialNodes = status.nodes || []
      // Najit nedokoncene instance uzlu pro dany proces.
      let selectedNodeInstances = nodeInstances.filter(
        node => potencialNodes.includes(node.status as ActivityStatus),
      )
      if (nodeInstance) {
        // Odstraneni prave zpracovavane instance uzlu ze seznamu nedokoncenych instanci uzlu.
        selectedNodeInstances = selectedNodeInstances
          .filter(node => node.id !== nodeInstance.id)
      }

      // Ukoncit pripravene/cekajici uzly
      let targetNodeInstances = selectedNodeInstances.map(node => {
        node.status = status.node
        return node
      })

      return {
        processInstance,
        targetNodeInstances,
      }
    }
    return {
      processInstance,
      targetNodeInstances: [],
    }
  }

  processWithdrawn(options:{
    processInstance: ProcessInstance,
    nodeInstance?: NodeElementInstance,
    nodeInstances: NodeElementInstance[],
    status: {
      process?: ProcessStatus,
    },
  }) {
    options.processInstance.endDateTime = new Date()
    return this.processUniversalWithdrawn({
      ...options,
      status: {
        process: options.status.process,
        node: ActivityStatus.Withdrawn,
        nodes: [ActivityStatus.Ready, ActivityStatus.Waiting],
      },
    })
  }
  processUnWithdrawn(options: {
    processInstance: ProcessInstance,
    nodeInstance?: NodeElementInstance,
    nodeInstances: NodeElementInstance[],
    status: {
      process?: ProcessStatus,
    },
  }) {
    return this.processUniversalWithdrawn({
      ...options,
      status: {
        process: options.status.process,
        node: ActivityStatus.Ready,
        nodes: [ActivityStatus.Withdrawn],
      },
    })
  }

  //#endregion

  //#region xxx

  // initAndSaveProcess - Vytvorit instanci procesu a prvniho uzelu
  // runProcessWidhrawn - ukonci proces a vsechni v nem obsazene instance
  // runIt / runNode - provede instanci uzlu
  // runNodeAdditionsFormat - provede/ziskej additionsFormat pro instanci uzlu
  // runNodeAdditions - Provede instanci uzlu - dodatky

  //#endregion
}
