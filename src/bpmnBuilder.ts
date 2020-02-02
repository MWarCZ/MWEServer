import { BaseElementTemplate } from 'entity/bpmn/baseElement'
import { parse, validate, X2jOptionsOptional } from 'fast-xml-parser'
import { Connection } from 'typeorm'

import { DataObjectTemplate } from './entity/bpmn/dataObject'
import { ProcessTemplate, ProcessType } from './entity/bpmn/process'
import { SequenceFlowTemplate } from './entity/bpmn/sequenceFlow'
import { NodeToSequenceFlow, SequenceFlowToNode } from './entity/bpmn/sequenceFlowToNode'
import { TaskTemplate } from './entity/bpmn/task'

/** BPMN NAMESPACE */
enum XmlNamespace {
  xsi = 'http://www.w3.org/2001/XMLSchema-instance',
  bpmn2 = 'http://www.omg.org/spec/BPMN/20100524/MODEL',
  bpmndi = 'http://www.omg.org/spec/BPMN/20100524/DI',
  dc = 'http://www.omg.org/spec/DD/20100524/DC',
  di = 'http://www.omg.org/spec/DD/20100524/DI',
  camunda = 'http://camunda.org/schema/1.0/bpmn',
  mwe = 'http://www.mwarcz.cz/mwe/bpmn/',
}
type BpmnNamespace = {
  xsi: string,
  bpmn2: string,
  bpmndi: string,
  dc: string,
  di: string,
  camunda: string,
  mwe: string,
}

/** Parsovani BPMN Level 1 */
type BpmnLevel1Process = {
  entity: ProcessTemplate, data: XmlProcess, type: 'process',
}
type BpmnLevel1Colaboration = {
  entity: BaseElementTemplate, data: undefined, type: 'colaboration',
}
type BpmnLevel1 = BpmnLevel1Process | BpmnLevel1Colaboration

/** Parsovani BPMN Level 2 */
type BpmnLevel2Task = {
  entity: TaskTemplate, data: XmlTask, type: 'task',
}
type BpmnLevel2SequenceFlow = {
  entity: SequenceFlowTemplate, data: XmlSequenceFlow, type: 'sequenceFlow',
}
type BpmnLevel2DataObject = {
  entity: DataObjectTemplate, data: XmlDataObject, type: 'dataObject',
}
type BpmnLevel2DataObjectReference = {
  entity: DataObjectTemplate | undefined, data: XmlDataObjectReference, type: 'dataObjectReference',
  refObject: { bpmnId: string, dataObjectRef: string },
}
type BpmnLevel2 = BpmnLevel2Task
                | BpmnLevel2SequenceFlow
                | BpmnLevel2DataObject
                | BpmnLevel2DataObjectReference

/** BPMN Builder */
export class BpmnBuilder {
  connection: Connection

  constructor(connection: Connection) {
    this.connection = connection
  }

  parseXmlDefinitions(data:any): XmlDefinitions {
    let keys = Object.keys(data)
    if (keys.length !== 1)
      throw new Error('Allowed is only one root xml element.')

    const definitions: XmlDefinitions = data[keys[0]][0]

    if (!definitions)
      throw new Error('Not found xml root element.')

    let ns = this.parseXmlNamespaces(definitions)
    if (keys[0] !== `${ns.bpmn2}definitions`)
      throw new Error(`Not found bpmn element <${ns.bpmn2}definitions>.`)

    return definitions
  }
  parseXmlNamespaces(definitions: XmlDefinitions): BpmnNamespace {
    const ns: BpmnNamespace = {
      xsi: '',
      bpmn2: '',
      bpmndi: '',
      dc: '',
      di: '',
      camunda: '',
      mwe: '',
    }
    Object.keys(definitions['#attr']).forEach(attr => {
      const splitedAttr = attr.split(':')
      if (splitedAttr[0] === 'xmlns' && splitedAttr.length === 2) {
        const uri = definitions['#attr'][attr]
        const nsTmp = `${splitedAttr[1]}:`
        if (uri === XmlNamespace.bpmn2)
          ns.bpmn2 = nsTmp
        if (uri === XmlNamespace.bpmndi)
          ns.bpmndi = nsTmp
        if (uri === XmlNamespace.camunda)
          ns.camunda = nsTmp
        if (uri === XmlNamespace.dc)
          ns.dc = nsTmp
        if (uri === XmlNamespace.di)
          ns.di = nsTmp
        if (uri === XmlNamespace.xsi)
          ns.xsi = nsTmp
        if (uri === XmlNamespace.mwe)
          ns.mwe = nsTmp
      }
    })
    return ns
  }

  parseBpmnLevel0() {

  }

  parseBpmnLevel1Process(ns: BpmnNamespace, process: XmlProcess): BpmnLevel1Process {
    let entity = new ProcessTemplate()
    entity.bpmnId = process['#attr'].id
    entity.name = process['#attr'].name
    entity.isExecutable = process['#attr'].isExecutable
    entity.processType = <ProcessType> process['#attr'][`${ns.mwe}versionType` as 'versionType']
    entity.version = process['#attr'][`${ns.mwe}version` as 'version']
    return {
      entity,
      data: process,
      type: 'process',
    }
  }
  parseBpmnLevel1(ns: BpmnNamespace, definitions: XmlDefinitions): BpmnLevel1[] {
    const queueL1: BpmnLevel1[] = []

    let processes = definitions[`${ns.bpmn2}process` as 'process']
    if (!!processes) {
      processes.forEach(process => {
        queueL1.push(this.parseBpmnLevel1Process(ns, process))
      })
    }
    return queueL1
  }

  parseBpmnLevel2DataObject(ns: BpmnNamespace, dataObject: XmlDataObject): BpmnLevel2DataObject {
    let entity = new DataObjectTemplate()
    entity.bpmnId = dataObject['#attr'].id
    entity.name = dataObject['#attr'].name
    entity.strict = dataObject['#attr'][`${ns.mwe}strict` as 'strict']
    return {
      entity,
      data: dataObject,
      type: 'dataObject',
    }
  }
  parseBpmnLevel2DataObjectReference(ns: BpmnNamespace, dataObjectReference: XmlDataObjectReference): BpmnLevel2DataObjectReference {
    return {
      entity: undefined,
      refObject: {
        bpmnId: dataObjectReference['#attr'].id || '',
        dataObjectRef: dataObjectReference['#attr'].dataObjectRef,
      },
      data: dataObjectReference,
      type: 'dataObjectReference',
    }
  }
  parseBpmnLevel2Task(ns: BpmnNamespace, task: XmlTask): BpmnLevel2Task {
    let entity = new TaskTemplate()
    entity.bpmnId = task['#attr'].id
    entity.name = task['#attr'].name
    return {
      entity,
      data: task,
      type: 'task',
    }
  }
  parseBpmnLevel2SequenceFlow(ns: BpmnNamespace, seq: XmlSequenceFlow): BpmnLevel2SequenceFlow {
    let entity = new SequenceFlowTemplate()
    entity.bpmnId = seq['#attr'].id
    entity.name = seq['#attr'].name
    return {
      entity,
      data: seq,
      type: 'sequenceFlow',
    }
  }
  parseBpmnLevel2(ns: BpmnNamespace, process: BpmnLevel1Process): BpmnLevel2[] {
    const queueL2: BpmnLevel2[] = []

    /* NUTNE ZACHOVAT PORADI ZPRACOVANI!
      DataObject
      Task
      Event
      Gateway
      SequenceFlow
    */
    let dataObjects = process.data[`${ns.bpmn2}dataObject` as 'dataObject']
    if (!!dataObjects) {
      let tmpQ = dataObjects.map(d => this.parseBpmnLevel2DataObject(ns, d))
      tmpQ.forEach(dataObject => {
        dataObject.entity.processTemplate = process.entity
      })
      queueL2.push(...tmpQ)
    }

    let dataObjectReference = process.data[`${ns.bpmn2}dataObjectReference` as 'dataObjectReference']
    if (!!dataObjectReference) {
      let tmpQ = dataObjectReference.map(d => this.parseBpmnLevel2DataObjectReference(ns, d))
      tmpQ.forEach(dataObjectReference => {
        // Pripojit entitu dataObjectTemplate k referenci na dataObject
        let dataObject = queueL2.find(d => {
          return d.type === 'dataObject'
              && d.entity.bpmnId === dataObjectReference.refObject.dataObjectRef
        })
        if (dataObject) {
          dataObjectReference.entity = dataObject.entity
        }
      })
      queueL2.push(...tmpQ)
    }

    let tasks = process.data[`${ns.bpmn2}task` as 'task']
    if (!!tasks) {
      let tmpQ = tasks.map(t => this.parseBpmnLevel2Task(ns, t))
      tmpQ.forEach(task => {
        task.entity.processTemplate = process.entity
      })
      queueL2.push(...tmpQ)
    }

    // ... Event, Gateway, ...

    // sequenceFlow MUSI BYT POSLEDNI VE FRONTE!!!
    let sequenceFlows = process.data[`${ns.bpmn2}sequenceFlow` as 'sequenceFlow']
    if (!!sequenceFlows) {
      let tmpQ = sequenceFlows.map(s => this.parseBpmnLevel2SequenceFlow(ns, s))
      tmpQ.forEach(seq => {
        let source = queueL2.find(x => x.entity && x.entity.bpmnId === seq.data['#attr'].sourceRef)
        if (source) {
          let n2s = new NodeToSequenceFlow()
          if (source.type === 'task') {
            n2s.task = source.entity
          } else {
            throw new Error(
              `SequenceFlow has not element '${source.type}' with id '${source.entity && source.entity.bpmnId}'`)
          }
          // TODO: Event, Gateway
          seq.entity.source = n2s
        }

        let target = queueL2.find(x => x.entity && x.entity.bpmnId === seq.data['#attr'].targetRef)
        if (target) {
          let s2n = new SequenceFlowToNode()
          if (target.type === 'task') {
            s2n.task = target.entity
          } else {
            throw new Error(
              `SequenceFlow has not element '${target.type}' with id '${target.entity && target.entity.bpmnId}'`)
          }
          // TODO: Event, Gateway
          seq.entity.target = s2n
        }
      })
      queueL2.push(...tmpQ)
    }

    return queueL2
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

    // let keys = Object.keys(data)
    // let definitions: TDefinitions[] = (keys.length === 1)? data[keys[0]]:undefined
    // let nsKeys = Object.keys(definitions['#attr'])

    const definitions = this.parseXmlDefinitions(data)
    let ns = this.parseXmlNamespaces(definitions)

    // Nalzeni procesu a vyvoreni instanci
    let queueL1 = this.parseBpmnLevel1(ns, definitions)
    let queueL2: BpmnLevel2[] = []

    console.log({ queueL1 })

    // Zpracovani L2
    queueL1.forEach(elementL1 => {
      if (elementL1.type === 'process') {
        let tmpQ = this.parseBpmnLevel2(ns, elementL1)
        // Doplneni sekundarnich vztahu mezi elementy L2 a L1
        tmpQ.forEach(node => {
          if (node.entity) {
            node.entity.processTemplate = elementL1.entity
          }
        })
        queueL2.push(...tmpQ)
        console.log({ tmpQ })
      }
    })
    // Zpracovani L3
    queueL2.forEach(elementL2 => {
      // Doplneni sekundarnich vztahu mezi elementy L3 a L2

      if (elementL2.type === 'task') {
        // console.log(`====task ${elementL2.entity.bpmnId}`)

        console.log(JSON.stringify(elementL2.data, null, 2))
        let xmlDataInputAssociations = elementL2.data[ `${ns.bpmn2}dataInputAssociation` as 'dataInputAssociation']

        // Existuje vstup dat?
        if (xmlDataInputAssociations) {
          // console.log(`=====dataInputAssociation`)
          xmlDataInputAssociations.forEach(inputAssociation => {
            // Vyfiltrovani datovych objektu a referenci
            let dataObjects = queueL2.filter(d=>{
              return (d.type === 'dataObject' || d.type === 'dataObjectReference')
            }) as (BpmnLevel2DataObject | BpmnLevel2DataObjectReference)[]
            // Pole s entitamy dataObject
            let inputDataObjects: DataObjectTemplate[] = []
            // console.log(`=====sourceRef `, JSON.stringify(inputAssociation, null, 2))
            let sourceRefs = inputAssociation[`${ns.bpmn2}sourceRef` as 'sourceRef']
            // Existuje odkaz zdroj dat
            if (typeof sourceRefs === 'object') {
              sourceRefs.forEach(sourceRef => {
                let dataObject = dataObjects.find(d=>{
                  return d.entity && d.entity.bpmnId === sourceRef["#text"]
                })
                if (dataObject && dataObject.entity) {
                  inputDataObjects.push(dataObject.entity)
                }
              })
            } else if (typeof sourceRefs === 'string') {
              let dataObject = dataObjects.find(d => {
                if (d.type === 'dataObjectReference') {
                  return d.refObject.bpmnId === sourceRefs
                }
                return d.entity && d.entity.bpmnId === sourceRefs
              })
              if (dataObject && dataObject.entity) {
                inputDataObjects.push(dataObject.entity)
              }
              console.log('====xxxxxxx ', dataObject)
            }
            elementL2.entity.inputs = [...new Set(inputDataObjects)]
            console.log('====inputDataObjects ', inputDataObjects)
            console.log(JSON.stringify(elementL2, null, 2))
          })
        }
      } else if (elementL2.type === 'dataObject') {

      } else if (elementL2.type === 'sequenceFlow') {

      }
    })

    // Vyfiltrovani entit pro ulozeni do DB
    // Vyloucit undefined a duplicity
    let entityL1 = new Set(queueL1.map(e => e.entity).filter(e => !!e))
    await this.connection.manager.save([...entityL1])
    let entityL2 = new Set(queueL2.map(e => e.entity).filter(e => !!e))
    await this.connection.manager.save([...entityL2])
    // let proc = queueL1.shift()

    // console.log(JSON.stringify(data, null, 2))
    // console.log(JSON.stringify(ns, null, 2))
    // console.log({x})
    // console.log({ definitions })
  }
}

/** XML Elements */

type XmlBaseElementAttr = {
  id?: string,
  name?: string,
}

type XmlDefinitionsAttr = {
  [key: string]: string,
  targetNamespace: string,
} & XmlBaseElementAttr
type XmlDefinitions = {
  '#attr': XmlDefinitionsAttr,
  process?: XmlProcess[],
  collaboration?: {}[],
}

type XmlProcessAttr = {
  isExecutable?: boolean,
  processType?: string,
  versionType?: string,
  version?: string,
} & XmlBaseElementAttr
type XmlProcess = {
  '#attr': XmlProcessAttr,
  task?: XmlTask[],
  sequenceFlow?: XmlSequenceFlow[],
  dataObject?: XmlDataObject[],
  dataObjectReference?: XmlDataObjectReference[],
  startEvent?: XmlStartEvent[],
  endEvent?: XmlEndEvent[],
}

type XmlDataObjectAttr = {
  strict: boolean,
} & XmlBaseElementAttr
type XmlDataObject = {
  '#attr': XmlDataObjectAttr,
  extensionElements: {
    json?: XmlJson[],
  }[],
}

type XmlJsonAttr = {}
type XmlJson = {
  '#attr': XmlJsonAttr,
  '#text': string,
}

type XmlDataObjectReferenceAttr = {
  dataObjectRef: string,
} & XmlBaseElementAttr
type XmlDataObjectReference = {
  '#attr': XmlDataObjectReferenceAttr,
}


type XmlTaskAttr = {} & XmlBaseElementAttr
type XmlTask = {
  '#attr': XmlTaskAttr,
  dataOutputAssociation?: XmlDataOutputAssociation[],
  dataInputAssociation?: XmlDataInputAssociation[],
}

type XmlDataOutputAssociationAttr = {} & XmlBaseElementAttr
type XmlDataOutputAssociation = {
  '#attr': XmlDataOutputAssociationAttr,
  sourceRef?: string | XmlSourceRef[],
  targetRef?: string | XmlTargetRef[],
}
type XmlDataInputAssociationAttr = XmlDataOutputAssociationAttr
type XmlDataInputAssociation = {
  '#attr': XmlDataInputAssociationAttr,
  sourceRef?: string | XmlSourceRef[],
  targetRef?: string | XmlTargetRef[],
}
type XmlSourceRefAttr = {}
type XmlSourceRef = {
  '#attr': XmlSourceRefAttr,
  '#text': string,
}
type XmlTargetRefAttr = {}
type XmlTargetRef = {
  '#attr': XmlTargetRefAttr,
  '#text': string,
}

type XmlSequenceFlowAttr = {
  sourceRef: string,
  targetRef: string,
} & XmlBaseElementAttr
type XmlSequenceFlow = {
  '#attr': XmlSequenceFlowAttr,
  expression?: XmlExpression[],
  formalExpression?: XmlFormalExpression[],
}
type XmlExpressionAttr = {} & XmlBaseElementAttr
type XmlExpression = {
  '#attr': XmlExpressionAttr,
  '#text': string,
}
type XmlFormalExpressionAttr = {
  language?: string,
} & XmlExpressionAttr
type XmlFormalExpression = {
  '#attr': XmlFormalExpressionAttr,
  '#text': string,
}

type XmlStartEventAttr = {
  eventDefinitionRefs?: string,
} & XmlBaseElementAttr
type XmlStartEvent = {
  '#attr': XmlStartEventAttr,
}

type XmlEndEventAttr = {
  eventDefinitionRefs?: string,
} & XmlBaseElementAttr
type XmlEndEvent = {
  '#attr': XmlEndEventAttr,
}
