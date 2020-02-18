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
      throw new Error('Allowed is only one root xml element.')

    const definitions: BpmnFxm.Definitions = data[keys[0]][0]

    if (!definitions)
      throw new Error('Not found xml root element.')

    let ns = this.parseNamespaces(definitions)
    if (keys[0] !== `${ns.bpmn2}definitions`)
      throw new Error(`Not found bpmn element <${ns.bpmn2}definitions>.`)

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
  loadBaseElement<T extends BaseElementTemplate>(entity: T, attr?: BpmnFxm.BaseElementAttr): T {
    if (attr) {
      entity.bpmnId = attr.id
      entity.name = attr.name
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
    this.loadBaseElement(entity, process['#attr'])
    if (process['#attr']) {
      entity.isExecutable = process['#attr'].isExecutable
      // TODO Osetrit enum
      entity.processType = <ProcessType> process['#attr'].processType
      entity.versionType = <VersionType> process['#attr'][`${this.ns.mwe}versionType` as 'versionType']
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
    this.loadBaseElement(entity, dataObject['#attr'])
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
    }
    if (dataObjectReference['#attr']) {
      refObject.bpmnId = dataObjectReference['#attr'].id as string
      refObject.dataObjectRef = dataObjectReference['#attr'].dataObjectRef as string
    }
    return {
      entity: undefined,
      refObject,
      data: dataObjectReference,
      tag: 'dataObjectReference',
    }
  }
  parseTask(task: BpmnFxm.Task): BpmnLevel.Task {
    let entity = new NodeElementTemplate()
    this.loadBaseElement(entity, task['#attr'])
    if (task['#attr']) {
      entity.implementation = task['#attr'][`${this.ns.mwe}implementation` as 'implementation'] || 'task'
    }
    return {
      entity,
      data: task,
      tag: 'task',
    }
  }
  parseScriptTask(task: BpmnFxm.ScriptTask): BpmnLevel.ScriptTask {
    let entity = new NodeElementTemplate()
    this.loadBaseElement(entity, task['#attr'])
    if (task['#attr']) {
      entity.implementation = task['#attr'][`${this.ns.mwe}implementation` as 'implementation'] || 'scriptTask'
      // entity.scriptFormat = task['#attr'].scriptFormat
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
    this.loadBaseElement(entity, event['#attr'])
    if (event['#attr']) {
      entity.implementation = event['#attr'][`${this.ns.mwe}implementation` as 'implementation'] || 'startEvent'
    }
    return {
      entity,
      data: event,
      tag: 'startEvent',
    }
  }
  parseEndEvent(event: BpmnFxm.Task): BpmnLevel.EndEvent {
    let entity = new NodeElementTemplate()
    this.loadBaseElement(entity, event['#attr'])
    if (event['#attr']) {
      entity.implementation = event['#attr'][`${this.ns.mwe}implementation` as 'implementation'] || 'endEvent'
    }
    return {
      entity,
      data: event,
      tag: 'endEvent',
    }
  }
  parseSequenceFlow(seq: BpmnFxm.SequenceFlow): BpmnLevel.SequenceFlow {
    let entity = new SequenceFlowTemplate()
    this.loadBaseElement(entity, seq['#attr'])
    return {
      entity,
      data: seq,
      tag: 'sequenceFlow',
    }
  }

  parseGateway(gateway: BpmnFxm.Gateway, implementation: string): BpmnLevel.Gateway {
    let entity = new NodeElementTemplate()
    this.loadBaseElement(entity, gateway['#attr'])
    if (gateway['#attr']) {
      entity.implementation = gateway['#attr'][`${this.ns.mwe}implementation` as 'implementation'] || implementation
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
    let queues: {
      DataObject: BpmnLevel.DataObject[],
      DataObjectReference: BpmnLevel.DataObjectReference[],
      Task: BpmnLevel.Task[],
      StartEvent: BpmnLevel.StartEvent[],
      EndEvent: BpmnLevel.EndEvent[],
      SequenceFlow: BpmnLevel.SequenceFlow[],
      Gateway: BpmnLevel.Gateway[],
      ScriptTask: BpmnLevel.ScriptTask[],
    } = {
      DataObject: [],
      DataObjectReference: [],
      Task: [],
      StartEvent: [],
      EndEvent: [],
      SequenceFlow: [],
      Gateway: [],
      ScriptTask: [],
    }

    // GET OBJECTS

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
    // SequenceFlow
    let sequenceFlows = process.data[`${this.ns.bpmn2}sequenceFlow` as 'sequenceFlow']
    if (typeof sequenceFlows === 'object') {
      queues.SequenceFlow = sequenceFlows.map(s => this.parseSequenceFlow(s))
    }

    // RELATIONS OBJECTS

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
      }
    })
    // Task
    queues.Task.forEach(task => {
      this.loadFlowElement(task.entity, process.entity)
      this.loadTaskIO(task.entity, task.data, queues)
    })
    // ScriptTask
    queues.ScriptTask.forEach(task => {
      this.loadFlowElement(task.entity, process.entity)
      this.loadTaskIO(task.entity, task.data, queues)
      this.loadScriptTask(task.entity, task.data)
    })

    // StartEvent
    queues.StartEvent.forEach(event => {
      this.loadFlowElement(event.entity, process.entity)
      // TODO Definition
    })
    // EndEvent
    queues.EndEvent.forEach(event => {
      this.loadFlowElement(event.entity, process.entity)
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

    return queues
  }

  connectNode2SequenceFlow<T extends NodeElementTemplate>(
    sequenceFlowEntity: SequenceFlowTemplate, nodeEntity: T, referenceBpmnId: string,
  ): boolean {
    if (nodeEntity.bpmnId === referenceBpmnId) {
      // let n2s = new ConnectorNode2Sequence()
      // if (nodeEntity instanceof BasicTaskTemplate) {
      //   n2s.task = nodeEntity
      // } else if (nodeEntity instanceof EventTemplate) {
      //   n2s.event = nodeEntity
      // } else if (nodeEntity instanceof GatewayTemplate) {
      //   n2s.gateway = nodeEntity
      // } else {
      //   throw new Error('Entitu T not compatibile with NodeToSequenceFlow.')
      // }
      // sequenceFlowEntity.source = n2s
      sequenceFlowEntity.source = nodeEntity
      return true
    }
    return false
  }

  connectSequenceFlow2Node<T extends NodeElementTemplate>(
    sequenceFlowEntity: SequenceFlowTemplate, nodeEntity: T, referenceBpmnId: string,
  ): boolean {
    if (nodeEntity.bpmnId === referenceBpmnId) {
      // let s2n = new ConnectorSequence2Node()
      // if (nodeEntity instanceof BasicTaskTemplate) {
      //   s2n.task = nodeEntity
      // } else if (nodeEntity instanceof EventTemplate) {
      //   s2n.event = nodeEntity
      // } else if (nodeEntity instanceof GatewayTemplate) {
      //   s2n.gateway = nodeEntity
      // } else {
      //   throw new Error('Entitu T not compatibile with SequenceFlowToNode.')
      // }
      // sequenceFlowEntity.target = s2n
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

  loadTaskIO<T extends NodeElementTemplate>(
    entity: T,
    attr: BpmnFxm.Task,
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
          // NEPROHAZOVAT! Gateway bude ukladan drive nez sekvence
          // V dobe ukladani gateway neexistuji sekvence!
          // seqence.entity.default = entity
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
    },
  ): T {
    // Source = Outgoing Propojeni Uzlu a odchoziho spoje
    if (attr && attr['#attr'] && attr['#attr'].sourceRef) {
      let sourceRef = attr['#attr'].sourceRef

      let okSource = queues.Task.find(task => {
        this.connectNode2SequenceFlow(entity, task.entity, sourceRef)
      }) || queues.StartEvent.find(event => {
        this.connectNode2SequenceFlow(entity, event.entity, sourceRef)
      }) || queues.Gateway.find(event => {
        this.connectNode2SequenceFlow(entity, event.entity, sourceRef)
      }) || queues.ScriptTask.find(task => {
        this.connectNode2SequenceFlow(entity, task.entity, sourceRef)
      })
    }

    // Target = Incoming Propojeni Uzlu a prichoziho spoje
    if (attr && attr['#attr'] && attr['#attr'].targetRef) {
      let targetRef = attr['#attr'].targetRef
      let okTarget = queues.Task.find(task => {
        this.connectSequenceFlow2Node(entity, task.entity, targetRef)
      }) || queues.EndEvent.find(event => {
        this.connectSequenceFlow2Node(entity, event.entity, targetRef)
      }) || queues.Gateway.find(event => {
        this.connectSequenceFlow2Node(entity, event.entity, targetRef)
      }) || queues.ScriptTask.find(task => {
        this.connectSequenceFlow2Node(entity, task.entity, targetRef)
      })
    }
    return entity
  }

  // loadEvent<T extends EventTemplate>(
  //   entity: EventTemplate,
  //   attr: BpmnFxm.EndEvent,
  // ) {

  // }

}
