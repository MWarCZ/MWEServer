import { Connection, Equal, In } from 'typeorm'

import { EndEvent } from '../bpmnRunnerPlugins/endEvent'
import { ExclusiveGateway, InclusiveGateway, ParallelGateway } from '../bpmnRunnerPlugins/gateway'
import { LinkIntermediateCatchEvent, LinkIntermediateThrowEvent } from '../bpmnRunnerPlugins/linkIntermediateEvent'
import { ScriptTask } from '../bpmnRunnerPlugins/scriptTask'
import { StartEvent } from '../bpmnRunnerPlugins/startEvent'
import { Task } from '../bpmnRunnerPlugins/task'
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
import { executeNode } from './executeHelpers'
import * as InitHelpers from './initHelpers'
import { DataRegister, FinishProcess, IDsCollector } from './plugins'
import {
  LibrariesWithNodeImplementations,
  LibrariesWithServiceImplementations,
  NodeImplementation,
} from './pluginsImplementation'
import { convertToProvideNodes, createContextForNode, createEmptyContext, RunContextProvideNodes } from './runContext'
import { SupportedNode } from './supportedNode'


export const DefaultPluginsWithNodeImplementations: LibrariesWithNodeImplementations = {
  [SupportedNode.Task]: Task,
  [SupportedNode.ScriptTask]: ScriptTask,

  [SupportedNode.ExclusiveGateway]: ExclusiveGateway,
  [SupportedNode.InclusiveGateway]: InclusiveGateway,
  [SupportedNode.ParallelGateway]: ParallelGateway,

  [SupportedNode.StartEvent]: StartEvent,
  [SupportedNode.EndEvent]: EndEvent,

  [SupportedNode.LinkIntermediateCatchEvent]: LinkIntermediateCatchEvent,
  [SupportedNode.LinkIntermediateThrowEvent]: LinkIntermediateThrowEvent,
}

export const DefaultPluginsWithServiceImplementations: LibrariesWithServiceImplementations = [
  new IDsCollector({
    name: 'initNext',
  }),
]

export class BpmnRunner {

  connection: Connection
  pluginsWithImplementations: LibrariesWithNodeImplementations
  pluginsWithServices: LibrariesWithServiceImplementations

  constructor(
    connection: Connection,
    pluginsWithImplementations?: LibrariesWithNodeImplementations,
    pluginsWithServices?: LibrariesWithServiceImplementations,
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
    processInstance = await this.connection.manager.save(processInstance)

    // Vytvoreni instance prvniho startovaciho eventu
    let startEventI = await this.initNodeElement(processInstance, [startEventT])
    startEventI = await this.saveElement(startEventI)

    return {
      process: processInstance,
      node: startEventI[0],
    }
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
  // [x] Spustit instanci uzlu
  //    [x] prerun
  //    [x] run
  //    [x] oncomplete
  //    [x] onfailling
  //    [x] osetreni vsech vyjimek zpusobenych implementaci
  // [x] Ulozit vystupni data
  //    [x] Ziskej instance datovych objekt; pokud existuji
  //    [x] Neexistuje instance datoveho objektu, tak ji vytvo5
  //    [x] Prochazet vzstupni data v kontextu (obj key = dT name)
  // [ ] Ukoncuje uzel proces?
  //    [ ] Ukoncuje nasilne? (Neceka se na dokonceni ostatnich)
  //        [ ] Ano:
  //            [ ] Nastav proces jako ukonceny
  //            [ ] U vsech existujicich instanci uzlu nastav stav jako preruseny
  //            (Ready, Waiting -> Widraw) -> Zmena se musi projevit ve fronte X
  //        [x] Ne:
  //            [x] Kontrola zda existuje jina aktivni instance v procesu.
  //            [x] Existuje: tak pokracovat dal.
  //            [x] Neexistuje: Ukoncist proces.
  // [ ] Spusti uzel dalsi uzly?
  //    [x] Ziskat sablonu uzlu
  //    [ ] Ziskat implementaci uzlu
  //    [ ] Vyhodnotit podminky stanovene v nastaveni implementace
  //    [x] Vytvorit novou ci najit cekajici instanci uzlu a nastavit status na ready
  //        [ ] Vlozit instance do fronty Y
  //    [x] Vytvorit instance sekvenci seqI(seqT, sourceNodeI, targetNodeI)
  // [x] Ulozit vse do databaze
  // [ ] Naplanovat zpracovani dalsich uzlu
  //    [ ] Uzly z fronty Y do fronty X
  //
  async runIt(options: {
    instance: NodeElementInstance | { id: number },
  }) {

    //#region Find and load data from DB.

    let nodeInstance = await this.connection.manager.findOneOrFail(NodeElementInstance, {
      relations: [
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

    // 1) Overit zda polozka existuje.
    // 2) Ulozit objekt v polozce do samostatne promenne.
    // 3) Odstranit polozku z puvodniho objektu.
    //    Proc? Problem pri ukladani -> vyrazne zretezeni zpusobuje problemy.
    if (!nodeInstance.template) {throw new Error('Instance uzelu nema sablonu')}
    let nodeTemplate = nodeInstance.template
    delete nodeInstance.template
    if (!nodeTemplate.incoming) {throw new Error('Sablona uzelu nema vstupni seqence')}
    let incomingSequenceTemplates = nodeTemplate.incoming
    delete nodeTemplate.incoming
    if (!nodeTemplate.outgoing) {throw new Error('Sablona uzelu nema vystupni seqence')}
    let outgoingSequenceTemplates = nodeTemplate.outgoing
    delete nodeTemplate.outgoing
    if (!nodeTemplate.inputs) {throw new Error('Sablona uzelu nema vstupni data')}
    let inputsDataTemplates = nodeTemplate.inputs
    delete nodeTemplate.inputs
    if (!nodeTemplate.outputs) {throw new Error('Sablona uzelu nema vystupni data')}
    let outputsDataTemplates = nodeTemplate.outputs
    delete nodeTemplate.outputs
    if (!nodeInstance.processInstance) {throw new Error('Instance uzelu nema instanci procesu')}
    let processInstance = nodeInstance.processInstance
    delete nodeInstance.processInstance
    if (!processInstance.processTemplate) {throw new Error('Instance procesu nema sablonu procesu')}
    let processTemplate = processInstance.processTemplate
    delete processInstance.processTemplate

    if (!processTemplate.nodeElements) {throw new Error('Sablona procesu neobsahuje seznam sablon uzlu')}
    let nodeTemplates = processTemplate.nodeElements
    delete processTemplate.nodeElements
    if (!processInstance.nodeElements) {throw new Error('Instance procesu neobsahuje seznam instanci uzlu')}
    let nodeInstances = processInstance.nodeElements
    delete processInstance.nodeElements

    // Implementace pro dany uzel => Zjistit nastavene predvolby
    let implementation = this.getImplementation(nodeTemplate.implementation as string)

    // Potrebuji data v globalnim meritku procesu?
    const { scope_inputs, scope_outputs, max_count_recurrence_node = 1 } = implementation.options || {}

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

    let result = this.runNode({
      incomingSequenceInstances,
      incomingSequenceTemplates,
      inputsDataInstances,
      inputsDataTemplates,
      nodeInstance,
      nodeTemplate,
      outgoingSequenceInstances,
      outgoingSequenceTemplates,
      outputsDataInstances,
      outputsDataTemplates,
      processInstance,
      processTemplate,
      nodeTemplates,
      nodeInstances,
    })

    //#region Save data to DB

    // Ulozit do DB
    await this.connection.manager.save(result.nodeInstance) // aktualni instance
    await this.connection.manager.save(result.outputsDataInstances) // Nova data
    await this.connection.manager.save(result.targetNodeInstances) // Nove pripravene instance uzlu
    await this.connection.manager.save(result.targetSequenceInstances) // Nove pripravene instance seqenci
    await this.connection.manager.save(result.processInstance) // Proces mohl skoncit

    //#endregion

    return result
  }
  runNode(options: {
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
  }) {
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

    //#region Predpripravy pro vykonani uzlu.

    // Nalezeni implementace pro dany uzel.
    let implementation = this.getImplementation(nodeTemplate.implementation as string)

    // Chce dostat uzel informace i o jinych uzlech v sablone
    const { provideNodes } = implementation.options || {}
    let provideNodeTemplates: RunContextProvideNodes[] = []
    if (provideNodes) {
      let tmpNodes = convertToProvideNodes({nodeTemplates})
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

    //#endregion

    let returnValues: {
      // Seznam obsahujici id sequenceFlow, ktere maji byt provedeny.
      initNext: number[],
      // Informace o ukoceni procesu.
      finishProcess: { finished: boolean, forced: boolean },
      registerGlobal: JsonMap,
      registerLocal: JsonMap,
      outputs?: JsonMap,
    } = {
      initNext: [],
      finishProcess: { finished: false, forced: false },
      registerGlobal: {},
      registerLocal: {},
    }

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
    let results = executeNode({
      nodeInstance,
      context,
      nodeImplementation: implementation,
      services,
    })

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
    // Odstraneni prave zpracovavane instance uzlu ze seznamu nedokoncenych instanci uzlu.
    unfinishedNodeInstances = unfinishedNodeInstances.filter(node => node.id !== nodeInstance.id)
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
      }

    } else {
      // Neni konec, ale jiz neni co dale vykonat => proces konci chybou
      if (unfinishedNodeInstances.length === 0 && targetNodeInstances.length === 0) {
        processInstance.status = ProcessStatus.Failled
        processInstance.endDateTime = new Date()
      }
    }


    //#endregion

    return {
      nodeInstance,
      outputsDataInstances,
      targetNodeInstances,
      targetSequenceInstances,
      processInstance,
    }
  }
  getImplementation(name: string): NodeImplementation {
    let implementation = this.pluginsWithImplementations[name]
    if (typeof implementation !== 'object') {
      throw new Error(`Implementace ulohy '${name}' nenalezena.`)
    }
    return implementation
  }

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
        const { max_count_recurrence_node = 1 } = targetImplementation.options || {}
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

}
