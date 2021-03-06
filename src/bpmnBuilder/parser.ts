///////////////////////////////////////
// Soubor: src/bpmnBuilder/parser.ts
// Projekt: MWEServer
// Autor: Miroslav Válka
///////////////////////////////////////
import he from 'he'

import { SupportedNode } from '../bpmnRunner/supportedNode'
import {
  BaseElementTemplate,
  DataObjectTemplate,
  FlowElementTemplate,
  NodeElementTemplate,
  ProcessTemplate,
  ProcessType,
  SequenceFlowTemplate,
  VersionType,
} from '../entity/bpmn'
import { BpmnFxm } from './bpmnFxm'
import { BpmnLevel } from './bpmnLevel'
import { BpmnNamespace, BpmnNamespaceUri } from './namespace'
import { ParseError } from './parseError'


/**
 * Slouzi k extrakci dat o podnikovych procesech.
 */
export class Parser {
  /**
   * Aliasy jmennych prostoru pouzitych v BPMN pro definici struktury procesu.
   */
  ns: BpmnNamespace = {
    xsi: '',
    bpmn2: '',
    bpmndi: '',
    dc: '',
    di: '',
    camunda: '',
    mwe: '',
  }

  // Definitions
  /** Zpracovani a validace tagu `Definitions`.*/
  parseDefinitions(data: any): BpmnFxm.Definitions {
    let keys = Object.keys(data)
    if (keys.length !== 1)
      throw new ParseError('Allowed is only one root xml element.')

    const definitions: BpmnFxm.Definitions = data[keys[0]][0]

    if (!definitions)
      throw new ParseError('Not found xml root element.')

    let ns = this.parseNamespaces(definitions)
    if (keys[0] !== `${ns.bpmn2}definitions`)
      throw new ParseError(`Not found bpmn element <${ns.bpmn2}definitions>.`)

    return definitions
  }
  // Namespace
  /** Nalezeni definic jmennych prostoru a nalezeni jejich aliasu. */
  parseNamespaces(definitions: BpmnFxm.Definitions): BpmnNamespace {
    const ns: BpmnNamespace = {
      xsi: '',
      bpmn2: '',
      bpmndi: '',
      dc: '',
      di: '',
      camunda: '',
      mwe: '',
    }
    let definitionsAttr = definitions['#attr']
    if (definitionsAttr) {
      Object.keys(definitionsAttr).forEach(attr => {
        const splitedAttr = attr.split(':')
        if (splitedAttr[0] === 'xmlns' && splitedAttr.length === 2) {
          const uri = (definitionsAttr) ? definitionsAttr[attr] : ''
          const nsTmp = `${splitedAttr[1]}:`
          if (uri === BpmnNamespaceUri.bpmn2)
            ns.bpmn2 = nsTmp
          if (uri === BpmnNamespaceUri.bpmndi)
            ns.bpmndi = nsTmp
          if (uri === BpmnNamespaceUri.camunda)
            ns.camunda = nsTmp
          if (uri === BpmnNamespaceUri.dc)
            ns.dc = nsTmp
          if (uri === BpmnNamespaceUri.di)
            ns.di = nsTmp
          if (uri === BpmnNamespaceUri.xsi)
            ns.xsi = nsTmp
          if (uri === BpmnNamespaceUri.mwe)
            ns.mwe = nsTmp
        }
      })
    }
    return ns
  }
  /** Nacteni aliasu jmennych prostoru z definice pro identifikaci elementu. */
  loadNamespaces(definitions: BpmnFxm.Definitions): BpmnNamespace {
    return this.ns = this.parseNamespaces(definitions)
  }

  // BaseElement
  /** Nacteni zakladnich atributu pro kazdy element. */
  preloadBaseElement<T extends BaseElementTemplate>(entity: T, attr?: BpmnFxm.BaseElementAttr): T {
    if (attr) {
      entity.bpmnId = attr.id
      entity.name = attr.name
    }
    return entity
  }
  // BaseElement
  /** Nacteni zakladnich atributu pro kazdy uzel. */
  preloadNodeElement<T extends NodeElementTemplate>(
    entity: T,
    attr?: BpmnFxm.NodeElementAttr,
    defaultImplementation?: string,
  ): T {
    if (attr) {
      entity.implementation = attr[`${this.ns.mwe}implementation` as 'implementation'] || defaultImplementation
    }
    return entity
  }
  // FlowElementTemplate
  /** Nacteni zakladnich vlastnosti pro podelementy procesu. */
  loadFlowElement<T extends FlowElementTemplate>(entity: T, process: ProcessTemplate): T {
    entity.processTemplate = process
    return entity
  }
  // Process
  /** Zpracovani tagu `process` a vytvoreni zakladu jeho reprezentace. */
  parseProcess(process: BpmnFxm.Process): BpmnLevel.Process {
    let entity = new ProcessTemplate()
    this.preloadBaseElement(entity, process['#attr'])
    if (process['#attr']) {
      let tmpIsExecutable = process['#attr'].isExecutable
      if (typeof tmpIsExecutable !== 'undefined') {
        entity.isExecutable = tmpIsExecutable
      }
      let tmpProcessType = process['#attr'].processType
      switch (tmpProcessType) {
        case ProcessType.None:
        case ProcessType.Private:
        case ProcessType.Public:
          entity.processType = <ProcessType> tmpProcessType
          break
        case undefined: break
        default:
          throw new ParseError(`Process: Unknown value '${tmpProcessType}' in processType.`)
      }

      let tmpVersionTag = process['#attr'][`${this.ns.camunda}versionTag` as 'versionTag']
      tmpVersionTag && (entity.version = tmpVersionTag)

      let tmpVerType = process['#attr'][`${this.ns.mwe}versionType` as 'versionType']
      switch (tmpVerType) {
        case VersionType.number:
        case VersionType.semver:
          entity.versionType = <VersionType> tmpVerType
          break
        case undefined: break
        default:
          throw new ParseError(`Process: Unknown value '${tmpVerType}' in versionType`)
      }
      let tmpVersion = process['#attr'][`${this.ns.mwe}version` as 'version']
      tmpVersion && (entity.version = tmpVersion)
    }
    return {
      entity,
      data: process,
      tag: 'process',
    }
  }
  // Level 1
  /** Zpracovani 1. urovne - tj. vytvoreni zakladu sablon procesu a identifikace manageru */
  parseLevel1(definitions: BpmnFxm.Definitions) {
    const queues: {
      Process: BpmnLevel.Process[],
    } = {
      Process: [],
    }

    let processes = definitions[`${this.ns.bpmn2}process` as 'process']
    if (!!processes) {
      queues.Process = processes.map(process => this.parseProcess(process))
    }

    let collaborations = definitions[`${this.ns.bpmn2}collaboration` as 'collaboration']
    if (!!collaborations) {
      // Load candidateMangaer for process from collaborations
      collaborations.map(collaboration => {
        let participants = collaboration[`${this.ns.bpmn2}participant` as 'participant']
        if (!!participants) {
          return participants.map(participant => {
            let attr = participant['#attr']
            let process = queues.Process.find(proc => attr && (proc.entity.bpmnId === attr.processRef))
            if (process) {
              process.entity.candidateManager = (attr) ? attr.name : ''
            }
          })
        }
        return []
      })
    }
    return queues
  }

  // DataObject
  /** Zpracovani tagu `dataObject` a vytvoreni zakladu jeho reprezentace. */
  parseDataObject(dataObject: BpmnFxm.DataObject): BpmnLevel.DataObject {
    let entity = new DataObjectTemplate()
    this.preloadBaseElement(entity, dataObject['#attr'])
    if (dataObject['#attr']) {
      entity.strict = dataObject['#attr'][`${this.ns.mwe}strict` as 'strict']
    }
    return {
      entity,
      data: dataObject,
      tag: 'dataObject',
    }
  }
  /** Zpracovani tagu `dataObjectReference` a vytvoreni podkladu pro jeho napojeni na datovy objekt. */
  parseDataObjectReference(dataObjectReference: BpmnFxm.DataObjectReference): BpmnLevel.DataObjectReference {
    let refObject = {
      bpmnId: '',
      dataObjectRef: '',
      name: '',
    }
    if (dataObjectReference['#attr']) {
      refObject.bpmnId = dataObjectReference['#attr'].id as string
      refObject.dataObjectRef = dataObjectReference['#attr'].dataObjectRef as string
      refObject.name = dataObjectReference['#attr'].name as string
    }
    return {
      entity: undefined,
      refObject,
      data: dataObjectReference,
      tag: 'dataObjectReference',
    }
  }
  /** Zpracovani tagu `task` a vytvoreni zakladu jeho reprezentace. */
  parseTask(task: BpmnFxm.Task, defaultImplementation?: string): BpmnLevel.Task {
    let entity = new NodeElementTemplate()
    this.preloadBaseElement(entity, task['#attr'])
    this.preloadNodeElement(entity, task['#attr'], defaultImplementation || SupportedNode.Task)
    return {
      entity,
      data: task,
      tag: 'task',
    }
  }
  /** Zpracovani tagu `scriptTask` a vytvoreni zakladu jeho reprezentace. */
  parseScriptTask(task: BpmnFxm.ScriptTask): BpmnLevel.ScriptTask {
    let entity = new NodeElementTemplate()
    this.preloadBaseElement(entity, task['#attr'])
    this.preloadNodeElement(entity, task['#attr'], SupportedNode.ScriptTask)
    if (task['#attr']) {
      entity.data['scriptFormat'] = task['#attr'].scriptFormat || 'js'
    }
    return {
      entity,
      data: task,
      tag: 'scriptTask',
    }
  }
  /** Zpracovani tagu `StartEvent` a vytvoreni zakladu jeho reprezentace. */
  parseStartEvent(event: BpmnFxm.StartEvent): BpmnLevel.StartEvent {
    let entity = new NodeElementTemplate()
    this.preloadBaseElement(entity, event['#attr'])
    this.preloadNodeElement(entity, event['#attr'], SupportedNode.StartEvent)
    return {
      entity,
      data: event,
      tag: 'startEvent',
    }
  }
  /** Zpracovani tagu `EndEvent` a vytvoreni zakladu jeho reprezentace. */
  parseEndEvent(event: BpmnFxm.EndEvent): BpmnLevel.EndEvent {
    let entity = new NodeElementTemplate()
    this.preloadBaseElement(entity, event['#attr'])
    // this.preloadNodeElement(entity, event['#attr'], SupportedNode.EndEvent)
    this.preloadEndEvent(entity, event)
    return {
      entity,
      data: event,
      tag: 'endEvent',
    }
  }
  /** Zpracovani tagu `IntermediateThrowEvent` a vytvoreni zakladu jeho reprezentace. */
  parseIntermediateThrowEvent(event: BpmnFxm.IntermediateThrowEvent): BpmnLevel.IntermediateThrowEvent {
    let entity = new NodeElementTemplate()
    this.preloadBaseElement(entity, event['#attr'])
    // this.preloadNodeElement(entity, event['#attr'], SupportedNode.IntermediateThrowEvent)
    this.preloadIntermediateThrowEvent(entity, event)
    return {
      entity,
      data: event,
      tag: 'intermediateThrowEvent',
    }
  }
  /** Zpracovani tagu `IntermediateCatchEvent` a vytvoreni zakladu jeho reprezentace. */
  parseIntermediateCatchEvent(event: BpmnFxm.IntermediateCatchEvent): BpmnLevel.IntermediateCatchEvent {
    let entity = new NodeElementTemplate()
    this.preloadBaseElement(entity, event['#attr'])
    // this.preloadNodeElement(entity, event['#attr'], SupportedNode.IntermediateCatchEvent)
    this.preloadIntermediateCatchEvent(entity, event)
    return {
      entity,
      data: event,
      tag: 'intermediateCatchEvent',
    }
  }
  /** Zpracovani tagu `SequenceFlow` a vytvoreni zakladu jeho reprezentace. */
  parseSequenceFlow(seq: BpmnFxm.SequenceFlow): BpmnLevel.SequenceFlow {
    let entity = new SequenceFlowTemplate()
    this.preloadBaseElement(entity, seq['#attr'])

    let expression = seq[`${this.ns.bpmn2}expression` as 'expression']
    if (Array.isArray(expression)) {
      expression.map(exp => {
        entity.expression =  exp['#text'] || ''
      })
    } else {
      entity.expression = expression || ''
    }

    let conditionExpression = seq[`${this.ns.bpmn2}conditionExpression` as 'conditionExpression']
    if (Array.isArray(conditionExpression)) {
      conditionExpression.map(exp => {
        entity.expression = exp['#text'] || ''
      })
    } else {
      entity.expression = conditionExpression || ''
    }
    entity.expression = he.decode(entity.expression)

    return {
      entity,
      data: seq,
      tag: 'sequenceFlow',
    }
  }

  /** Zpracovani tagu `*gateway` a vytvoreni zakladu jeho reprezentace. */
  parseGateway(gateway: BpmnFxm.Gateway, implementation: string): BpmnLevel.Gateway {
    let entity = new NodeElementTemplate()
    this.preloadBaseElement(entity, gateway['#attr'])
    this.preloadNodeElement(entity, gateway['#attr'], implementation)
    if (gateway['#attr']) {
      entity.data['direction'] = gateway['#attr'].gatewayDirections || null
      entity.data['type'] = implementation
    }
    return {
      entity,
      data: gateway,
      tag: 'gateway',
    }
  }

  // Level 2
  /**
   * Zpracovani 2. urovne
   * Vytvoreni obsahu a struktury tvorici sablonu procesu.
   * Zahrnuje zpracovani vsech elementu obsazenich v procesu
   * a vytvoreni jejich vzajemnych vztahu.
   */
  parseLevel2(process: BpmnLevel.Process) {
    //#region Queues
    let queues: {
      DataObject: BpmnLevel.DataObject[],
      DataObjectReference: BpmnLevel.DataObjectReference[],
      Task: BpmnLevel.Task[],
      StartEvent: BpmnLevel.StartEvent[],
      EndEvent: BpmnLevel.EndEvent[],
      SequenceFlow: BpmnLevel.SequenceFlow[],
      Gateway: BpmnLevel.Gateway[],
      ScriptTask: BpmnLevel.ScriptTask[],
      ServiceTask: BpmnLevel.Task[],
      SendTask: BpmnLevel.Task[],
      ReceiveTask: BpmnLevel.Task[],
      UserTask: BpmnLevel.Task[],
      ManualTask: BpmnLevel.Task[],
      CallActivity: BpmnLevel.Task[],
      BusinessRuleTask: BpmnLevel.Task[],
      IntermediateThrowEvent: BpmnLevel.IntermediateThrowEvent[],
      IntermediateCatchEvent: BpmnLevel.IntermediateCatchEvent[],
    } = {
      DataObject: [],
      DataObjectReference: [],
      Task: [],
      StartEvent: [],
      EndEvent: [],
      SequenceFlow: [],
      Gateway: [],
      ScriptTask: [],
      ServiceTask: [],
      SendTask: [],
      ReceiveTask: [],
      UserTask: [],
      ManualTask: [],
      CallActivity: [],
      BusinessRuleTask: [],
      IntermediateThrowEvent: [],
      IntermediateCatchEvent: [],
    }
    //#endregion

    // GET OBJECTS
    //#region Get Objects - parse it

    // DataObject
    let dataObjects = process.data[`${this.ns.bpmn2}dataObject` as 'dataObject']
    if (typeof dataObjects === 'object') {
      queues.DataObject = dataObjects.map(d => this.parseDataObject(d))
    }
    // DataObjectReference
    let dataObjectReference = process.data[`${this.ns.bpmn2}dataObjectReference` as 'dataObjectReference']
    if (typeof dataObjectReference === 'object') {
      queues.DataObjectReference = dataObjectReference.map(d => this.parseDataObjectReference(d))
    }
    // Task
    let tasks = process.data[`${this.ns.bpmn2}task` as 'task']
    if (typeof tasks === 'object') {
      queues.Task = tasks.map(t => this.parseTask(t))
    }
    // ScriptTask
    let scriptTasks = process.data[`${this.ns.bpmn2}scriptTask` as 'scriptTask']
    if (typeof scriptTasks === 'object') {
      queues.ScriptTask = scriptTasks.map(t => this.parseScriptTask(t))
    }
    // serviceTask ServiceTask
    let serviceTasks = process.data[`${this.ns.bpmn2}serviceTask` as 'serviceTask']
    if (typeof serviceTasks === 'object') {
      queues.ServiceTask = serviceTasks.map(t => this.parseTask(t, 'serviceTask'))
    }
    // sendTask SendTask
    let sendTasks = process.data[`${this.ns.bpmn2}sendTask` as 'sendTask']
    if (typeof sendTasks === 'object') {
      queues.SendTask = sendTasks.map(t => this.parseTask(t, 'sendTask'))
    }
    // receiveTask ReceiveTask
    let receiveTasks = process.data[`${this.ns.bpmn2}receiveTask` as 'receiveTask']
    if (typeof receiveTasks === 'object') {
      queues.ReceiveTask = receiveTasks.map(t => this.parseTask(t, 'receiveTask'))
    }
    // userTask UserTask
    let userTasks = process.data[`${this.ns.bpmn2}userTask` as 'userTask']
    if (typeof userTasks === 'object') {
      queues.UserTask = userTasks.map(t => this.parseTask(t, SupportedNode.UserTask))
    }
    // manualTask ManualTask
    let manualTasks = process.data[`${this.ns.bpmn2}manualTask` as 'manualTask']
    if (typeof manualTasks === 'object') {
      queues.ManualTask = manualTasks.map(t => this.parseTask(t, SupportedNode.ManualTask))
    }
    // callActivity CallActivity
    let callActivitys = process.data[`${this.ns.bpmn2}callActivity` as 'callActivity']
    if (typeof callActivitys === 'object') {
      queues.CallActivity = callActivitys.map(t => this.parseTask(t, 'callActivity'))
    }
    // businessRuleTask BusinessRuleTask
    let businessRuleTasks = process.data[`${this.ns.bpmn2}businessRuleTask` as 'businessRuleTask']
    if (typeof businessRuleTasks === 'object') {
      queues.BusinessRuleTask = businessRuleTasks.map(t => this.parseTask(t, 'businessRuleTask'))
    }

    // Gateway
    let exclusiveGateways = process.data[`${this.ns.bpmn2}exclusiveGateway` as 'exclusiveGateway']
    if (typeof exclusiveGateways === 'object') {
      queues.Gateway.push(...exclusiveGateways.map(
        g => this.parseGateway(g, SupportedNode.ExclusiveGateway),
      ))
    }
    let parallelGateways = process.data[`${this.ns.bpmn2}parallelGateway` as 'parallelGateway']
    if (typeof parallelGateways === 'object') {
      queues.Gateway.push(...parallelGateways.map(g =>
        this.parseGateway(g, SupportedNode.ParallelGateway),
      ))
    }
    let inclusiveGateways = process.data[`${this.ns.bpmn2}inclusiveGateway` as 'inclusiveGateway']
    if (typeof inclusiveGateways === 'object') {
      queues.Gateway.push(...inclusiveGateways.map(g =>
        this.parseGateway(g, SupportedNode.InclusiveGateway),
      ))
    }

    // StartEvent
    let startEvents = process.data[`${this.ns.bpmn2}startEvent` as 'startEvent']
    if (typeof startEvents === 'object') {
      queues.StartEvent = startEvents.map(e => this.parseStartEvent(e))
    }
    // EndEvent
    let endEvents = process.data[`${this.ns.bpmn2}endEvent` as 'endEvent']
    if (typeof endEvents === 'object') {
      queues.EndEvent = endEvents.map(e => this.parseEndEvent(e))
    }
    // intermediateThrowEvent
    let intermediateThrowEvents = process.data[`${this.ns.bpmn2}intermediateThrowEvent` as 'intermediateThrowEvent']
    if (typeof intermediateThrowEvents === 'object') {
      queues.IntermediateThrowEvent = intermediateThrowEvents.map(e => this.parseIntermediateThrowEvent(e))
    }
    // intermediateCatchEvent
    let intermediateCatchEvents = process.data[`${this.ns.bpmn2}intermediateCatchEvent` as 'intermediateCatchEvent']
    if (typeof intermediateCatchEvents === 'object') {
      queues.IntermediateCatchEvent = intermediateCatchEvents.map(e => this.parseIntermediateCatchEvent(e))
    }


    // SequenceFlow
    let sequenceFlows = process.data[`${this.ns.bpmn2}sequenceFlow` as 'sequenceFlow']
    if (typeof sequenceFlows === 'object') {
      queues.SequenceFlow = sequenceFlows.map(s => this.parseSequenceFlow(s))
    }

    //#endregion

    let allTasks = [
      ...queues.Task,
      ...queues.ScriptTask,
      ...queues.ServiceTask,
      ...queues.SendTask,
      ...queues.ReceiveTask,
      ...queues.UserTask,
      ...queues.ManualTask,
      ...queues.CallActivity,
      ...queues.BusinessRuleTask,
    ]
    let allEvents = [
      ...queues.StartEvent,
      ...queues.EndEvent,
      ...queues.IntermediateThrowEvent,
      ...queues.IntermediateCatchEvent,
    ]
    let allNodeElements = [
      ...allTasks,
      ...allEvents,
      ...queues.Gateway,
    ]

    // LaneSet, Lane => Nacteni candidateAssignee
    let laneSets = process.data[`${this.ns.bpmn2}laneSet` as 'laneSet']
    if (typeof laneSets === 'object') {
      laneSets.map(laneSet => this.loadLaneSet(laneSet, {NodeElement: allNodeElements}))
    }

    // RELATIONS OBJECTS
    //#region Ralations Objects - load/parse secondary props tree

    // DataObject
    queues.DataObject.forEach(dataObject => {
      this.loadFlowElement(dataObject.entity, process.entity)
      this.loadDataObject(dataObject.entity, dataObject.data)
    })
    // DataObjectReference
    queues.DataObjectReference.forEach(dataObjectReference => {
      // Pripojit entitu dataObjectTemplate k referenci na dataObject
      let dataObject = queues.DataObject.find(d => {
        return d.entity.bpmnId === dataObjectReference.refObject.dataObjectRef
      })
      if (dataObject) {
        dataObjectReference.entity = dataObject.entity
        if (!dataObjectReference.entity.name) {
          // Pokud objekt nema jmeno pouzij jmeno z reference.
          dataObjectReference.entity.name = dataObjectReference.refObject.name
        }
      }
    })

    //#region Tasks

    // Task
    // ScriptTask
    // ServiceTask
    // SendTask
    // ReceiveTask
    // UserTask
    // ManualTask
    // CallActivity
    // BusinessRuleTask
    allTasks.forEach(task => {
      this.loadFlowElement(task.entity, process.entity)
      this.loadNodeInputs(task.entity, task.data, queues)
      this.loadNodeOutputs(task.entity, task.data, queues)
    })
    // individualni nacitani / parsovani pro konkretni typ
    queues.ScriptTask.forEach(task => {
      this.loadScriptTask(task.entity, task.data)
    })

    //#endregion

    // StartEvent
    queues.StartEvent.forEach(event => {
      this.loadFlowElement(event.entity, process.entity)
      this.loadNodeOutputs(event.entity, event.data, queues)
      // TODO Definition
    })
    // EndEvent
    queues.EndEvent.forEach(event => {
      this.loadFlowElement(event.entity, process.entity)
      this.loadNodeInputs(event.entity, event.data, queues)
      // TODO Definition
    })
    // IntermediateThrowEvent
    queues.IntermediateThrowEvent.forEach(event => {
      this.loadFlowElement(event.entity, process.entity)
      this.loadNodeOutputs(event.entity, event.data, queues)
      // TODO Definition
    })
    // IntermediateCatchEvent
    queues.IntermediateCatchEvent.forEach(event => {
      this.loadFlowElement(event.entity, process.entity)
      this.loadNodeInputs(event.entity, event.data, queues)
      // TODO Definition
    })


    // SequenceFlow
    queues.SequenceFlow.forEach(seq => {
      this.loadFlowElement(seq.entity, process.entity)
      this.loadSequenceFlow(seq.entity, seq.data, {NodeElement: allNodeElements})
    })
    // Gateway
    queues.Gateway.forEach(gateway => {
      this.loadFlowElement(gateway.entity, process.entity)
      this.loadGateway(gateway.entity, gateway.data, queues)
    })

    //#endregion

    return queues
  }

  loadLaneSet(
    attr: BpmnFxm.LaneSet,
    queues: { NodeElement: BpmnLevel.NodeElement[] },
  ) {
    // Najdi a prochazej Lane elementy.
    let lanes = attr[`${this.ns.bpmn2}lane` as 'lane']
    lanes && lanes.map(lane => {
      // Najdi nazev Lane, ktery bude pouzit jako vyraz k nalezeni skupiny/uzivatele.
      let { name: candidateAssignee = '' } = lane['#attr'] || {}
      // Prochazej vsecny reference na uzly patrici do Lane.
      let flowNodeRefs = lane[`${this.ns.bpmn2}flowNodeRef` as 'flowNodeRef']
      if (typeof flowNodeRefs === 'string') {
        flowNodeRefs = [flowNodeRefs] // Normalizace
      }
      flowNodeRefs && flowNodeRefs.map(flowNode => {
        // Prochazej uzly a do prvniho hodiciho se prirad nazev Lane
        queues.NodeElement.find(node => {
          if (node.entity.bpmnId === flowNode) {
            node.entity.candidateAssignee = candidateAssignee
            return true
          }
          return false
        })
      })
    })
  }

  /** Pomocna funkce pro propojeni uzlu a odchozi sekvence. */
  connectNode2SequenceFlow<T extends NodeElementTemplate>(
    sequenceFlowEntity: SequenceFlowTemplate, nodeEntity: T, referenceBpmnId: string,
  ): boolean {
    if (nodeEntity.bpmnId === referenceBpmnId) {
      sequenceFlowEntity.source = nodeEntity
      return true
    }
    return false
  }
  /** Pomocna funkce pro propojeni uzlu a prichozi sekvence. */
  connectSequenceFlow2Node<T extends NodeElementTemplate>(
    sequenceFlowEntity: SequenceFlowTemplate, nodeEntity: T, referenceBpmnId: string,
  ): boolean {
    if (nodeEntity.bpmnId === referenceBpmnId) {
      sequenceFlowEntity.target = nodeEntity
      return true
    }
    return false
  }

  /** Pomocna fukce pro nalezeni vztahu prirazeni datovych objektu k uzlu. */
  parseTaskDataAssociation(
    queueDataObjectReference: BpmnLevel.DataObjectReference[],
    queueDataObjects: BpmnLevel.DataObject[],
    bpmnReference: string | string[] | BpmnFxm.SourceRef[] | BpmnFxm.TargetRef[] | undefined,
  ): DataObjectTemplate[] {
    // Jen text v tagu
    if (typeof bpmnReference === 'string') {
      let dataObj = this.parseTaskDataAssociationReference(
        queueDataObjectReference, queueDataObjects, bpmnReference,
      )
      return (dataObj) ? [dataObj] : []
    }
    // Tag s textem a atributem
    else if (typeof bpmnReference === 'object') {
      let dataObjs = (bpmnReference as [])
        .reduce((acc: string[], ref: string | BpmnFxm.SourceRef | BpmnFxm.TargetRef) => {
          if (typeof ref === 'string') {
            acc.push(ref)
          } else {
            if (!!ref['#text'] && typeof ref['#text'] === 'string') {
              acc.push(ref['#text'])
            }
          }
          return acc
        }, [])
        .map(refId => this.parseTaskDataAssociationReference(
          queueDataObjectReference, queueDataObjects, refId,
        ))
        .filter(d => typeof d !== 'undefined') as DataObjectTemplate[]
      return [...dataObjs]
    }
    return []
  }

  /** Pomocna funkce pro rozliseni mezi datovym objektem a referenci na nej. */
  parseTaskDataAssociationReference(
    queueDataObjectReference: BpmnLevel.DataObjectReference[],
    queueDataObjects: BpmnLevel.DataObject[],
    bpmnReference: string,
  ): DataObjectTemplate | undefined {
    let obj = queueDataObjectReference.find(d => {
      return (d.refObject.bpmnId === bpmnReference)
    }) || queueDataObjects.find(d => {
      return (d.entity.bpmnId === bpmnReference)
    })
    return (obj) ? obj.entity : undefined
  }

  /** Nacteni vlastnosti a vytahu pro vstupni datove hodnoty uzlu. */
  loadNodeInputs<T extends NodeElementTemplate>(
    entity: T,
    attr: BpmnFxm.NodeElement,
    queues: {
      DataObjectReference: BpmnLevel.DataObjectReference[],
      DataObject: BpmnLevel.DataObject[],
    },
  ): T {
    // Prirazeni vstupnich dat
    let dataInputAssociations = attr[`${this.ns.bpmn2}dataInputAssociation` as 'dataInputAssociation']
    if (typeof dataInputAssociations === 'object') {
      let inputsDataObjectTemplate = dataInputAssociations.reduce((acc: DataObjectTemplate[], inputAssociation) => {
        let sourceRefs = inputAssociation[`${this.ns.bpmn2}sourceRef` as 'sourceRef']
        acc.push(...this.parseTaskDataAssociation(
          queues.DataObjectReference, queues.DataObject, sourceRefs,
        ))
        return acc
      }, [])
      entity.inputs = [...new Set(inputsDataObjectTemplate)]
    }
    return entity
  }
  /** Nacteni vlastnosti a vytahu pro vystupni datove hodnoty uzlu. */
  loadNodeOutputs<T extends NodeElementTemplate>(
    entity: T,
    attr: BpmnFxm.NodeElement,
    queues: {
      DataObjectReference: BpmnLevel.DataObjectReference[],
      DataObject: BpmnLevel.DataObject[],
    },
  ): T {
    // Prirazeni vystupnich dat
    let dataOutputAssociations = attr[`${this.ns.bpmn2}dataOutputAssociation` as 'dataOutputAssociation']
    if (typeof dataOutputAssociations === 'object') {
      let outputsDataObjectTemplate = dataOutputAssociations.reduce((acc: DataObjectTemplate[], inputAssociation) => {
        let targetRefs = inputAssociation[`${this.ns.bpmn2}targetRef` as 'targetRef']
        acc.push(...this.parseTaskDataAssociation(
          queues.DataObjectReference, queues.DataObject, targetRefs,
        ))
        return acc
      }, [])
      entity.outputs = [...new Set(outputsDataObjectTemplate)]
    }
    return entity
  }

  /** Nacteni vlastnosti pro elementy script task. */
  loadScriptTask<T extends NodeElementTemplate>(
    entity: T,
    attr: BpmnFxm.ScriptTask,
  ): T {
    let script = attr[`${this.ns.bpmn2}script` as 'script']
    if (typeof script !== 'object') {
      entity.data['script'] = he.decode(`${script}`)
    }
    return entity
  }
  /** Nacteni vlastnosti pro elementy data object. */
  loadDataObject<T extends DataObjectTemplate>(
    entity: T,
    attr: BpmnFxm.DataObject,

  ): T {
    entity.json = (entity.strict) ? { $strict: !!entity.strict } : { }

    let extensionElements = attr[`${this.ns.bpmn2}extensionElements` as 'extensionElements']
    if (typeof extensionElements === 'object') {
      extensionElements.find(ex => {
        let json = ex[`${this.ns.mwe}json` as 'json']
        try {
          if (typeof json === 'string') {
            let tmp = JSON.parse(json)
            if (typeof entity.json === 'object') {
              entity.json = {
                ...entity.json,
                ...tmp,
              }
            }
            return true
          } else if (typeof json === 'object') {
            if (json[0]['#text']) {
              let tmp = JSON.parse(json[0]['#text'])
              if (typeof entity.json === 'object') {
                entity.json = {
                  ...entity.json,
                  ...tmp,
                }
              }
              return true
            }
          }
        } catch (e) {
          throw new ParseError(`DataObject: Problem with parsing JSON. (id: '${entity.bpmnId}')`)
        }
        return false
      })
    }
    return entity
  }
  /** Nacteni vlastnosti pro elementy typu gateway. */
  loadGateway<T extends NodeElementTemplate>(
    entity: T,
    attr: BpmnFxm.Gateway,
    queues: {
      SequenceFlow: BpmnLevel.SequenceFlow[],
    },
  ): T {
    if (attr['#attr']) {
      let bpmnIdDefault = attr['#attr'].default
      queues.SequenceFlow.find(seqence => {
        if (bpmnIdDefault === seqence.entity.bpmnId) {
          seqence.entity.flag = 'default'
          return true
        }
        return false
      })
    }
    return entity
  }
  /** Nacteni vlastnosti a vztahu pro elementy sequence flow. */
  loadSequenceFlow<T extends SequenceFlowTemplate>(
    entity: T,
    attr: BpmnFxm.SequenceFlow,
    queues: {
      NodeElement: BpmnLevel.NodeElement[],
    },
  ): T {
    let queueNodes = queues.NodeElement

    // Source = Outgoing Propojeni Uzlu a odchoziho spoje
    if (attr && attr['#attr'] && attr['#attr'].sourceRef) {
      let sourceRef = attr['#attr'].sourceRef
      let okSource = queueNodes.find(node => {
        this.connectNode2SequenceFlow(entity, node.entity, sourceRef)
      })
    }

    // Target = Incoming Propojeni Uzlu a prichoziho spoje
    if (attr && attr['#attr'] && attr['#attr'].targetRef) {
      let targetRef = attr['#attr'].targetRef
      let okSource = queueNodes.find(node => {
        this.connectSequenceFlow2Node(entity, node.entity, targetRef)
      })
    }
    return entity
  }

  /** Pomocna funkce pro nacitani vlastnasti elementu EndEvent na zaklade jeho obsahu. */
  preloadEndEvent(entity: NodeElementTemplate, event: BpmnFxm.EndEvent) {
    let terminateEventDefinition = event[`${this.ns.bpmn2}terminateEventDefinition` as 'terminateEventDefinition']
    if (terminateEventDefinition) {
      this.preloadNodeElement(entity, event['#attr'], SupportedNode.TerminateEndEvent)
    } else {
      this.preloadNodeElement(entity, event['#attr'], SupportedNode.EndEvent)
    }
  }
  /** Pomocna funkce pro nacitani vlastnasti elementu IntermediateThrowEvent na zaklade jeho obsahu. */
  preloadIntermediateThrowEvent(entity: NodeElementTemplate, event: BpmnFxm.IntermediateThrowEvent) {
    let linkEventDefinition = event[`${this.ns.bpmn2}linkEventDefinition` as 'linkEventDefinition']
    if (linkEventDefinition) {
      let link = ''
      if (typeof linkEventDefinition === 'string') {
        link = linkEventDefinition
      } else {
        let firstLink = linkEventDefinition[0]
        if (firstLink['#attr'] && firstLink['#attr'].name) {
          link = firstLink['#attr'].name
        }
      }
      entity.data = { ...entity.data, link }
      this.preloadNodeElement(entity, event['#attr'], SupportedNode.LinkIntermediateThrowEvent)
    } else {
      this.preloadNodeElement(entity, event['#attr'], SupportedNode.IntermediateCatchEvent)
    }
    // TODO dalsi mozne event definice (else if)
  }
/** Pomocna funkce pro nacitani vlastnasti elementu IntermediateCatchEvent na zaklade jeho obsahu. */
  preloadIntermediateCatchEvent(entity: NodeElementTemplate, event: BpmnFxm.IntermediateCatchEvent) {
    let linkEventDefinition = event[`${this.ns.bpmn2}linkEventDefinition` as 'linkEventDefinition']
    let timerEventDefinition = event[`${this.ns.bpmn2}timerEventDefinition` as 'timerEventDefinition']
    if (linkEventDefinition) {
      let link = ''
      if (typeof linkEventDefinition === 'string') {
        link = linkEventDefinition
      } else {
        let firstLink = linkEventDefinition[0]
        if (firstLink['#attr'] && firstLink['#attr'].name) {
          link = firstLink['#attr'].name
        }
      }
      entity.data = { ...entity.data, link }
      this.preloadNodeElement(entity, event['#attr'], SupportedNode.LinkIntermediateCatchEvent)
    } else if (timerEventDefinition) {
      let foundData: {
        timeCycle?: string,
        timeDate?: string,
        timeDuration?: string,
      } = {}
      if (typeof timerEventDefinition !== 'string') {
        let first = timerEventDefinition[0]
        let timeCycle = first[`${this.ns.bpmn2}timeCycle` as 'timeCycle']
        if (Array.isArray(timeCycle)) {
          foundData.timeCycle = timeCycle[0]['#text']
        } else {
          foundData.timeCycle = timeCycle
        }
        let timeDate = first[`${this.ns.bpmn2}timeDate` as 'timeDate']
        if (Array.isArray(timeDate)) {
          foundData.timeDate = timeDate[0]['#text']
        } else {
          foundData.timeDate = timeDate
        }
        let timeDuration = first[`${this.ns.bpmn2}timeDuration` as 'timeDuration']
        if (Array.isArray(timeDuration)) {
          foundData.timeDuration = timeDuration[0]['#text']
        } else {
          foundData.timeDuration = timeDuration
        }
      }
      entity.data = { ...entity.data, ...(foundData as {}) }
      this.preloadNodeElement(entity, event['#attr'], SupportedNode.TimerIntermediateCatchEvent)
    } else {
      this.preloadNodeElement(entity, event['#attr'], SupportedNode.IntermediateCatchEvent)
    }
    // TODO dalsi mozne event definice (else if)
  }

}
