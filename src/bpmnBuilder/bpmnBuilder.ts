import { parse, validate, X2jOptionsOptional } from 'fast-xml-parser'
import { Connection } from 'typeorm'

import { BaseElementTemplate } from '../entity/bpmn/baseElement'
import { DataObjectTemplate } from '../entity/bpmn/dataObject'
import { EndEventTemplate } from '../entity/bpmn/endEvent'
import { EventTemplate } from '../entity/bpmn/event'
import { GatewayDirection, GatewayTemplate, GatewayType } from '../entity/bpmn/gateway'
import { ProcessTemplate, ProcessType, VersionType } from '../entity/bpmn/process'
import { SequenceFlowTemplate } from '../entity/bpmn/sequenceFlow'
import { NodeToSequenceFlow, SequenceFlowToNode } from '../entity/bpmn/sequenceFlowToNode'
import { StartEventTemplate } from '../entity/bpmn/startEvent'
import { TaskTemplate } from '../entity/bpmn/task'
import { BpmnFxm } from './bpmnFxm'
import { BpmnLevel } from './bpmnLevel'
import { BpmnNamespace, BpmnNamespaceUri } from './namespace'


export class BpmnBuilder {
  ns: BpmnNamespace = {
    xsi: '',
    bpmn2: '',
    bpmndi: '',
    dc: '',
    di: '',
    camunda: '',
    mwe: '',
  }
  connection: Connection

  constructor(connection: Connection) {
    this.connection = connection
  }

  // Definitions
  private parseDefinitions(data: any): BpmnFxm.Definitions {
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
  private parseNamespaces(definitions: BpmnFxm.Definitions): BpmnNamespace {
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
  private loadNamespaces(definitions: BpmnFxm.Definitions): BpmnNamespace {
    return this.ns = this.parseNamespaces(definitions)
  }

  // BaseElement
  private loadBaseElement<T extends BaseElementTemplate>(entity: T, attr?: BpmnFxm.BaseElementAttr): T {
    if (attr) {
      entity.bpmnId = attr.id
      entity.name = attr.name
    }
    return entity
  }
  // Process
  private parseProcess(process: BpmnFxm.Process): BpmnLevel.Process {
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
  private parseLevel1(definitions: BpmnFxm.Definitions) {
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
  private parseDataObject(dataObject: BpmnFxm.DataObject): BpmnLevel.DataObject {
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
  private parseDataObjectReference(dataObjectReference: BpmnFxm.DataObjectReference): BpmnLevel.DataObjectReference {
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
  private parseTask(task: BpmnFxm.Task): BpmnLevel.Task {
    let entity = new TaskTemplate()
    this.loadBaseElement(entity, task['#attr'])
    return {
      entity,
      data: task,
      tag: 'task',
    }
  }
  private parseStartEvent(event: BpmnFxm.StartEvent): BpmnLevel.StartEvent {
    let entity = new StartEventTemplate()
    this.loadBaseElement(entity, event['#attr'])
    return {
      entity,
      data: event,
      tag: 'startEvent',
    }
  }
  private parseEndEvent(event: BpmnFxm.Task): BpmnLevel.EndEvent {
    let entity = new EndEventTemplate()
    this.loadBaseElement(entity, event['#attr'])
    return {
      entity,
      data: event,
      tag: 'endEvent',
    }
  }
  private parseSequenceFlow(seq: BpmnFxm.SequenceFlow): BpmnLevel.SequenceFlow {
    let entity = new SequenceFlowTemplate()
    this.loadBaseElement(entity, seq['#attr'])
    if (seq['#attr']) {
      entity.bpmnId = seq['#attr'].id
      entity.name = seq['#attr'].name
    }
    return {
      entity,
      data: seq,
      tag: 'sequenceFlow',
    }
  }

  private parseGateway(gateway: BpmnFxm.Gateway, gatewayType: GatewayType): BpmnLevel.Gateway {
    let entity = new GatewayTemplate()
    this.loadBaseElement(entity, gateway['#attr'])
    if (gateway['#attr']) {
      entity.direction = gateway['#attr'].gatewayDirections as GatewayDirection
      entity.type = gatewayType
    }
    return {
      entity,
      data: gateway,
      tag: 'gateway',
    }
  }

  // Level 2
  private parseLevel2(process: BpmnLevel.Process) {
    let queues: {
      DataObject: BpmnLevel.DataObject[],
      DataObjectReference: BpmnLevel.DataObjectReference[],
      Task: BpmnLevel.Task[],
      StartEvent: BpmnLevel.StartEvent[],
      EndEvent: BpmnLevel.EndEvent[],
      SequenceFlow: BpmnLevel.SequenceFlow[],
      Gateway: BpmnLevel.Gateway[],
    } = {
      DataObject: [],
      DataObjectReference: [],
      Task: [],
      StartEvent: [],
      EndEvent: [],
      SequenceFlow: [],
      Gateway: [],
    // TODO ScriptTask, Gateway, ....
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
    // TODO ScriptTask, ....

    // Gateway
    let exclusiveGateways = process.data[`${this.ns.bpmn2}exclusiveGateway` as 'exclusiveGateway']
    if (typeof exclusiveGateways === 'object') {
      queues.Gateway.push(...exclusiveGateways.map(
        g => this.parseGateway(g, GatewayType.Exclusive),
      ))
    }
    let parallelGateways = process.data[`${this.ns.bpmn2}parallelGateway` as 'parallelGateway']
    if (typeof parallelGateways === 'object') {
      queues.Gateway.push(...parallelGateways.map(g =>
        this.parseGateway(g, GatewayType.Parallel),
      ))
    }
    let inclusiveGateways = process.data[`${this.ns.bpmn2}inclusiveGateway` as 'inclusiveGateway']
    if (typeof inclusiveGateways === 'object') {
      queues.Gateway.push(...inclusiveGateways.map(g =>
        this.parseGateway(g, GatewayType.Inclusive),
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
      dataObject.entity.processTemplate = process.entity
      let extensionElements = dataObject.data[`${this.ns.bpmn2}extensionElements` as 'extensionElements']
      if (typeof extensionElements === 'object') {
        extensionElements.find(ex => {
          let json = ex[`${this.ns.mwe}json` as 'json']
          if (typeof json === 'string') {
            dataObject.entity.json = JSON.parse(json)
            return true
          } else if (typeof json === 'object') {
            if (json[0]['#text']) {
              dataObject.entity.json = JSON.parse(json[0]["#text"])
              return true
            }
          }
          return false
        })
      }


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
      // Prirazeni k procesu
      task.entity.processTemplate = process.entity

      // Prirazeni vstupnich dat
      let dataInputAssociations = task.data[`${this.ns.bpmn2}dataInputAssociation` as 'dataInputAssociation']
      if (typeof dataInputAssociations === 'object') {
        let inputsDataObjectTemplate = dataInputAssociations.reduce((acc: DataObjectTemplate[], inputAssociation) => {
          let sourceRefs = inputAssociation[`${this.ns.bpmn2}sourceRef` as 'sourceRef']
          acc.push(...this.parseTaskDataAssociation(
            queues.DataObjectReference, queues.DataObject, sourceRefs,
          ))
          return acc
        }, [])
        task.entity.inputs = [...new Set(inputsDataObjectTemplate)]
      }
      // Prirazeni vystupnich dat
      let dataOutputAssociations = task.data[`${this.ns.bpmn2}dataOutputAssociation` as 'dataOutputAssociation']
      if (typeof dataOutputAssociations === 'object') {
        let outputsDataObjectTemplate = dataOutputAssociations.reduce((acc: DataObjectTemplate[], inputAssociation) => {
          let targetRefs = inputAssociation[`${this.ns.bpmn2}targetRef` as 'targetRef']
          acc.push(...this.parseTaskDataAssociation(
            queues.DataObjectReference, queues.DataObject, targetRefs,
          ))
          return acc
        }, [])
        task.entity.outputs = [...new Set(outputsDataObjectTemplate)]
      }
    })
    // TODO ScriptTask, ....

    // StartEvent
    queues.StartEvent.forEach(event => {
      event.entity.processTemplate = process.entity
    })
    // EndEvent
    queues.EndEvent.forEach(event => {
      event.entity.processTemplate = process.entity
    })
    // SequenceFlow
    queues.SequenceFlow.forEach(seq => {
      seq.entity.processTemplate = process.entity

      // Source = Outgoing Propojeni Uzlu a odchoziho spoje
      if (seq.data && seq.data['#attr'] && seq.data['#attr'].sourceRef) {
        let sourceRef = seq.data['#attr'].sourceRef
        let okSource = queues.Task.find(task => {
          this.connectNode2SequenceFlow(seq.entity, task.entity, sourceRef)
        }) || queues.StartEvent.find(event => {
          this.connectNode2SequenceFlow(seq.entity, event.entity, sourceRef)
        }) || queues.Gateway.find(event => {
          this.connectNode2SequenceFlow(seq.entity, event.entity, sourceRef)
        })
        // || queueEvents.find(...) || queueGateways.find(...)
        // TODO
      }

      // Target = Incoming Propojeni Uzlu a prichoziho spoje
      if (seq.data && seq.data['#attr'] && seq.data['#attr'].targetRef) {
        let targetRef = seq.data['#attr'].targetRef
        let okTarget = queues.Task.find(task => {
          this.connectSequenceFlow2Node(seq.entity, task.entity, targetRef)
        }) || queues.EndEvent.find(event => {
          this.connectSequenceFlow2Node(seq.entity, event.entity, targetRef)
        }) || queues.Gateway.find(event => {
          this.connectSequenceFlow2Node(seq.entity, event.entity, targetRef)
        })
        // || queueEvents.find(...) || queueGateways.find(...)
        // TODO
      }
    })
    // Gateway
    queues.Gateway.forEach(gateway => {
      gateway.entity.processTemplate = process.entity

      if (gateway.data['#attr']) {
        let bpmnIdDefault = gateway.data['#attr'].default
        queues.SequenceFlow.find(seqence => {
          if (bpmnIdDefault === seqence.entity.bpmnId) {
            // NEPROHAZOVAT! Gateway bude ukladan drive nez sekvence
            // V dobe ukladani gateway neexistuji sekvence!
            seqence.entity.default = gateway.entity
            return true
          }
          return false
        })
      }

    })

    return queues
  }

  private connectNode2SequenceFlow<T extends BaseElementTemplate>(
    sequenceFlowEntity: SequenceFlowTemplate, nodeEntity: T, referenceBpmnId: string,
  ): boolean {
    if (nodeEntity.bpmnId === referenceBpmnId) {
      let n2s = new NodeToSequenceFlow()
      if (nodeEntity instanceof TaskTemplate) {
        n2s.task = nodeEntity
      } else if (nodeEntity instanceof EventTemplate) {
        n2s.event = nodeEntity
      } else if (nodeEntity instanceof GatewayTemplate) {
        n2s.gateway = nodeEntity
      } else {
        throw new Error('Entitu T not compatibile with NodeToSequenceFlow.')
      }
      sequenceFlowEntity.source = n2s
      return true
    }
    return false
  }

  private connectSequenceFlow2Node<T extends BaseElementTemplate>(
    sequenceFlowEntity: SequenceFlowTemplate, nodeEntity: T, referenceBpmnId: string,
  ): boolean {
    if (nodeEntity.bpmnId === referenceBpmnId) {
      let s2n = new SequenceFlowToNode()
      if (nodeEntity instanceof TaskTemplate) {
        s2n.task = nodeEntity
      } else if (nodeEntity instanceof EventTemplate) {
        s2n.event = nodeEntity
      } else if (nodeEntity instanceof GatewayTemplate) {
        s2n.gateway = nodeEntity
      } else {
        throw new Error('Entitu T not compatibile with SequenceFlowToNode.')
      }
      sequenceFlowEntity.target = s2n
      return true
    }
    return false
  }

  private parseTaskDataAssociation(
    queueDataObjectReference: BpmnLevel.DataObjectReference[],
    queueDataObjects: BpmnLevel.DataObject[],
    bpmnReference: string | BpmnFxm.SourceRef[] | BpmnFxm.TargetRef[] | undefined,
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
      let dataObjs = bpmnReference
        .reduce((acc: string[], ref) => (!!ref['#text']) ? [...acc, ref['#text']] : acc, [])
        .map(refId => this.parseTaskDataAssociationReference(
          queueDataObjectReference, queueDataObjects, refId,
        ))
        .filter(d => typeof d !== 'undefined') as DataObjectTemplate[]
      return [...dataObjs]
    }
    return []
  }

  private parseTaskDataAssociationReference(
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


  async loadFromFxp(dataFxp: any ) {
    const definitions = this.parseDefinitions(dataFxp)
    this.loadNamespaces(definitions)
    const level1 = this.parseLevel1(definitions)
    const level2 = level1.Process.map(process => this.parseLevel2(process))

    let process = new Set(level1.Process.map(e => e.entity))
    await this.connection.manager.save([...process])

    await Promise.all(
      level2.map(async(level) => {
        // NUTNE zachovat porad!
        let dataObjects = new Set(level.DataObject.map(e => e.entity).filter(e => !!e))
        await this.connection.manager.save([...dataObjects])

        let tasks = new Set(level.Task.map(e => e.entity).filter(e => !!e))
        let startEvents = new Set(level.StartEvent.map(e => e.entity).filter(e => !!e))
        let endEvents = new Set(level.EndEvent.map(e => e.entity).filter(e => !!e))
        let gateways = new Set(level.Gateway.map(e => e.entity).filter(e => !!e))
        await this.connection.manager.save([
          ...tasks,
          ...startEvents,
          ...endEvents,
          ...gateways,
        ])

        let sequenceFlows = new Set(level.SequenceFlow.map(e => e.entity).filter(e => !!e))
        await this.connection.manager.save([...sequenceFlows])
      }),
    )

  }

  async loadFromXml(xmlBpmn: string) {
    validate(xmlBpmn, {
      allowBooleanAttributes: false,
    })

    const options: X2jOptionsOptional = {
      attributeNamePrefix: '',
      attrNodeName: '#attr',
      textNodeName: '#text',
      ignoreAttributes: false,
      ignoreNameSpace: false,
      allowBooleanAttributes: false,
      parseNodeValue: true,
      parseAttributeValue: true,
      trimValues: true,
      cdataTagName: '#cdata',
      cdataPositionChar: '\\c',
      parseTrueNumberOnly: false,
      arrayMode: true, // "strict"
      // attrValueProcessor: (val, attrName) => he.decode(
      //  val, { isAttributeValue:true }),//default is a=>a
      // tagValueProcessor: (val, tagName) => he.decode(val), //default is a=>a
      stopNodes: ['bpmndi:BPMNDiagram'],
    }

    const data = parse(xmlBpmn, options)

    await this.loadFromFxp(data)

  }
}
