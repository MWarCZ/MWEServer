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


export class Parser {
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
  loadNamespaces(definitions: BpmnFxm.Definitions): BpmnNamespace {
    return this.ns = this.parseNamespaces(definitions)
  }

  // BaseElement
  preloadBaseElement<T extends BaseElementTemplate>(entity: T, attr?: BpmnFxm.BaseElementAttr): T {
    if (attr) {
      entity.bpmnId = attr.id
      entity.name = attr.name
    }
    return entity
  }
  // BaseElement
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
  loadFlowElement<T extends FlowElementTemplate>(entity: T, process: ProcessTemplate): T {
    entity.processTemplate = process
    return entity
  }
  // Process
  parseProcess(process: BpmnFxm.Process): BpmnLevel.Process {
    let entity = new ProcessTemplate()
    this.preloadBaseElement(entity, process['#attr'])
    if (process['#attr']) {
      entity.isExecutable = process['#attr'].isExecutable
      // TODO Osetrit enum
      let tmpProcessType = process['#attr'].processType
      switch (tmpProcessType) {
        case ProcessType.None:
        case ProcessType.Private:
        case ProcessType.Public:
          entity.processType = <ProcessType>tmpProcessType
          break
        case undefined: break
        default:
          throw new ParseError(`Process: Unknown value '${tmpProcessType}' in processType.`)
      }
      let tmpVerType = process['#attr'][`${this.ns.mwe}versionType` as 'versionType']
      switch(tmpVerType) {
        case VersionType.number:
        case VersionType.semver:
          entity.versionType = <VersionType>tmpVerType
          break
        case undefined: break
        default:
          throw new ParseError(`Process: Unknown value '${tmpVerType}' in versionType`)
      }
      // entity.processType = <ProcessType> process['#attr'].processType
      // entity.versionType = <VersionType> process['#attr'][`${this.ns.mwe}versionType` as 'versionType']
      entity.version = process['#attr'][`${this.ns.mwe}version` as 'version']
    }
    return {
      entity,
      data: process,
      tag: 'process',
    }
  }
  // Level 1
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
    return queues
  }

  // DataObject
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
  parseTask(task: BpmnFxm.Task, defaultImplementation?: string): BpmnLevel.Task {
    let entity = new NodeElementTemplate()
    this.preloadBaseElement(entity, task['#attr'])
    this.preloadNodeElement(entity, task['#attr'], defaultImplementation || 'task')
    return {
      entity,
      data: task,
      tag: 'task',
    }
  }
  parseScriptTask(task: BpmnFxm.ScriptTask): BpmnLevel.ScriptTask {
    let entity = new NodeElementTemplate()
    this.preloadBaseElement(entity, task['#attr'])
    this.preloadNodeElement(entity, task['#attr'], 'scriptTask')
    if (task['#attr']) {
      entity.data['scriptFormat'] = task['#attr'].scriptFormat || 'js'
    }
    return {
      entity,
      data: task,
      tag: 'scriptTask',
    }
  }
  parseStartEvent(event: BpmnFxm.StartEvent): BpmnLevel.StartEvent {
    let entity = new NodeElementTemplate()
    this.preloadBaseElement(entity, event['#attr'])
    this.preloadNodeElement(entity, event['#attr'], 'startEvent')
    return {
      entity,
      data: event,
      tag: 'startEvent',
    }
  }
  parseEndEvent(event: BpmnFxm.Task): BpmnLevel.EndEvent {
    let entity = new NodeElementTemplate()
    this.preloadBaseElement(entity, event['#attr'])
    this.preloadNodeElement(entity, event['#attr'], 'endEvent')
    return {
      entity,
      data: event,
      tag: 'endEvent',
    }
  }
  parseIntermediateThrowEvent(event: BpmnFxm.IntermediateThrowEvent): BpmnLevel.IntermediateThrowEvent {
    let entity = new NodeElementTemplate()
    this.preloadBaseElement(entity, event['#attr'])
    this.preloadNodeElement(entity, event['#attr'], 'intermediateThrowEvent')
    return {
      entity,
      data: event,
      tag: 'intermediateThrowEvent',
    }
  }
  parseIntermediateCatchEvent(event: BpmnFxm.IntermediateCatchEvent): BpmnLevel.IntermediateCatchEvent {
    let entity = new NodeElementTemplate()
    this.preloadBaseElement(entity, event['#attr'])
    this.preloadNodeElement(entity, event['#attr'], 'intermediateCatchEvent')
    return {
      entity,
      data: event,
      tag: 'intermediateCatchEvent',
    }
  }
  parseSequenceFlow(seq: BpmnFxm.SequenceFlow): BpmnLevel.SequenceFlow {
    let entity = new SequenceFlowTemplate()
    this.preloadBaseElement(entity, seq['#attr'])
    return {
      entity,
      data: seq,
      tag: 'sequenceFlow',
    }
  }

  parseGateway(gateway: BpmnFxm.Gateway, implementation: string): BpmnLevel.Gateway {
    let entity = new NodeElementTemplate()
    this.preloadBaseElement(entity, gateway['#attr'])
    this.preloadNodeElement(entity, gateway['#attr'], implementation)
    if (gateway['#attr']) {
      // entity.implementation = gateway['#attr'][`${this.ns.mwe}implementation` as 'implementation'] || implementation
      // entity.direction = gateway['#attr'].gatewayDirections as GatewayDirection
      // entity.type = gatewayType
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
      queues.UserTask = userTasks.map(t => this.parseTask(t, 'userTask'))
    }
    // manualTask ManualTask
    let manualTasks = process.data[`${this.ns.bpmn2}manualTask` as 'manualTask']
    if (typeof manualTasks === 'object') {
      queues.ManualTask = manualTasks.map(t => this.parseTask(t, 'manualTask'))
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
        g => this.parseGateway(g, 'exclusiveGateway'),
      ))
    }
    let parallelGateways = process.data[`${this.ns.bpmn2}parallelGateway` as 'parallelGateway']
    if (typeof parallelGateways === 'object') {
      queues.Gateway.push(...parallelGateways.map(g =>
        this.parseGateway(g, 'parallelGateway'),
      ))
    }
    let inclusiveGateways = process.data[`${this.ns.bpmn2}inclusiveGateway` as 'inclusiveGateway']
    if (typeof inclusiveGateways === 'object') {
      queues.Gateway.push(...inclusiveGateways.map(g =>
        this.parseGateway(g, 'inclusiveGateway'),
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
    ;[
      ...queues.Task,
      ...queues.ScriptTask,
      ...queues.ServiceTask,
      ...queues.SendTask,
      ...queues.ReceiveTask,
      ...queues.UserTask,
      ...queues.ManualTask,
      ...queues.CallActivity,
      ...queues.BusinessRuleTask,
    ].forEach(task => {
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
      this.loadSequenceFlow(seq.entity, seq.data, queues)
    })
    // Gateway
    queues.Gateway.forEach(gateway => {
      this.loadFlowElement(gateway.entity, process.entity)
      this.loadGateway(gateway.entity, gateway.data, queues)
    })

    //#endregion

    return queues
  }

  connectNode2SequenceFlow<T extends NodeElementTemplate>(
    sequenceFlowEntity: SequenceFlowTemplate, nodeEntity: T, referenceBpmnId: string,
  ): boolean {
    if (nodeEntity.bpmnId === referenceBpmnId) {
      sequenceFlowEntity.source = nodeEntity
      return true
    }
    return false
  }

  connectSequenceFlow2Node<T extends NodeElementTemplate>(
    sequenceFlowEntity: SequenceFlowTemplate, nodeEntity: T, referenceBpmnId: string,
  ): boolean {
    if (nodeEntity.bpmnId === referenceBpmnId) {
      sequenceFlowEntity.target = nodeEntity
      return true
    }
    return false
  }

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

  loadScriptTask<T extends NodeElementTemplate>(
    entity: T,
    attr: BpmnFxm.ScriptTask,
  ): T {
    let script = attr[`${this.ns.bpmn2}script` as 'script']
    if (typeof script === 'string') {
      // entity.script = script
      entity.data['script'] = script
    }
    return entity
  }

  loadDataObject<T extends DataObjectTemplate>(
    entity: T,
    attr: BpmnFxm.DataObject,

  ): T {
    let extensionElements = attr[`${this.ns.bpmn2}extensionElements` as 'extensionElements']
    if (typeof extensionElements === 'object') {
      extensionElements.find(ex => {
        let json = ex[`${this.ns.mwe}json` as 'json']
        if (typeof json === 'string') {
          entity.json = JSON.parse(json)
          return true
        } else if (typeof json === 'object') {
          if (json[0]['#text']) {
            entity.json = JSON.parse(json[0]['#text'])
            return true
          }
        }
        return false
      })
    }
    return entity
  }

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


  loadSequenceFlow<T extends SequenceFlowTemplate>(
    entity: T,
    attr: BpmnFxm.SequenceFlow,
    queues: {
      Task: BpmnLevel.Task[],
      StartEvent: BpmnLevel.StartEvent[],
      EndEvent: BpmnLevel.EndEvent[],
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
    },
  ): T {
    let queueNodes = [
      ...queues.Task,
      ...queues.StartEvent,
      ...queues.EndEvent,
      ...queues.Gateway,
      ...queues.ScriptTask,
      ...queues.ServiceTask,
      ...queues.SendTask,
      ...queues.ReceiveTask,
      ...queues.UserTask,
      ...queues.ManualTask,
      ...queues.CallActivity,
      ...queues.BusinessRuleTask,
      ...queues.IntermediateThrowEvent,
      ...queues.IntermediateCatchEvent,
    ]

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

}
