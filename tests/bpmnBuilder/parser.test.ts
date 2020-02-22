import 'jest-extended'

import { parse as fxpParse } from 'fast-xml-parser'

import { BpmnFxm } from '../../src/bpmnBuilder/bpmnFxm'
import { BpmnLevel } from '../../src/bpmnBuilder/bpmnLevel'
import { options } from '../../src/bpmnBuilder/fxp.config'
import { BpmnNamespace } from '../../src/bpmnBuilder/namespace'
import { Parser } from '../../src/bpmnBuilder/parser'
import {
  DataObjectTemplate,
  NodeElementTemplate,
  ProcessTemplate,
  ProcessType,
  SequenceFlowTemplate,
  VersionType,
} from '../../src/entity/bpmn'

let parser: Parser

describe('Testy zakladnich funkci parseru (ploche parsovani).', () => {
  beforeEach(() => {
    parser = new Parser()
  })

  describe('Parse Definitions + Namespace.', () => {

    it('Prazdny tag definitions.', () => {
      let data = fxpParse(`
        <definitions id="Definitions_1"> </definitions>
    `, options)
      const NS: BpmnNamespace = {
        xsi: '',
        bpmn2: '',
        bpmndi: '',
        dc: '',
        di: '',
        camunda: '',
        mwe: '',
      }

      let definitions = parser.parseDefinitions(data)
      expect(definitions).toBeDefined()
      expect(definitions['#attr']).toBeDefined()

      let ns = parser.parseNamespaces(definitions)
      expect(ns).toMatchObject(NS)
    })

    it('Tag definitios se sadou jmennych prostoru V1.', () => {
      let data = fxpParse(`
        <bpmn:definitions
          xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
          xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL"
          xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI"
          xmlns:dc="http://www.omg.org/spec/DD/20100524/DC"
          xmlns:di="http://www.omg.org/spec/DD/20100524/DI"
          xmlns:mwe="http://www.mwarcz.cz/mwe/bpmn/"
          id="Definitions_1">
        </bpmn:definitions>
    `, options)
      const NS: BpmnNamespace = {
        xsi: 'xsi:',
        bpmn2: 'bpmn:',
        bpmndi: 'bpmndi:',
        dc: 'dc:',
        di: 'di:',
        camunda: '',
        mwe: 'mwe:',
      }

      let definitions = parser.parseDefinitions(data)
      expect(definitions).toBeDefined()
      expect(definitions['#attr']).toBeDefined()

      let ns = parser.parseNamespaces(definitions)
      expect(ns).toMatchObject(NS)

    })

    it('Tag definitios se sadou jmennych prostoru V2.', () => {
      let data = fxpParse(`
        <bpmn2:definitions
          xmlns:x="http://www.w3.org/2001/XMLSchema-instance"
          xmlns:bpmn2="http://www.omg.org/spec/BPMN/20100524/MODEL"
          xmlns:bdi="http://www.omg.org/spec/BPMN/20100524/DI"
          xmlns:dc="http://www.omg.org/spec/DD/20100524/DC"
          xmlns:di="http://www.omg.org/spec/DD/20100524/DI"
          xmlns:mwe="http://www.mwarcz.cz/mwe/bpmn/"
          xmlns:camunda="http://camunda.org/schema/1.0/bpmn"
          id="Definitions_1">
        </bpmn2:definitions>
    `, options)
      const NS: BpmnNamespace = {
        xsi: 'x:',
        bpmn2: 'bpmn2:',
        bpmndi: 'bdi:',
        dc: 'dc:',
        di: 'di:',
        camunda: 'camunda:',
        mwe: 'mwe:',
      }

      let definitions = parser.parseDefinitions(data)
      expect(definitions).toBeDefined()
      expect(definitions['#attr']).toBeDefined()

      let ns = parser.parseNamespaces(definitions)
      expect(ns).toMatchObject(NS)
    })

    it('Nacteni NS do interni reprezentace NS parseru.', () => {
      let data = fxpParse(`
        <bpmn2:definitions
          xmlns:x="http://www.w3.org/2001/XMLSchema-instance"
          xmlns:bpmn2="http://www.omg.org/spec/BPMN/20100524/MODEL"
          xmlns:bdi="http://www.omg.org/spec/BPMN/20100524/DI"
          xmlns:dc="http://www.omg.org/spec/DD/20100524/DC"
          xmlns:di="http://www.omg.org/spec/DD/20100524/DI"
          xmlns:mwe="http://www.mwarcz.cz/mwe/bpmn/"
          xmlns:camunda="http://camunda.org/schema/1.0/bpmn"
          id="Definitions_1">
        </bpmn2:definitions>
    `, options)
      const NS: BpmnNamespace = {
        xsi: 'x:',
        bpmn2: 'bpmn2:',
        bpmndi: 'bdi:',
        dc: 'dc:',
        di: 'di:',
        camunda: 'camunda:',
        mwe: 'mwe:',
      }

      let definitions = parser.parseDefinitions(data)
      parser.loadNamespaces(definitions)
      expect(parser.ns).toMatchObject(NS)

    })

    it('Chyba: Vice root elementu.', () => {
      let data = fxpParse(`
        <Xxx id="Xxx"> </Xxx>
        <definitions id="Definitions_1"> </definitions>
      `, options)

      expect(() => parser.parseDefinitions(data)).toThrowError()
    })

    it('Chyba: Nic.', () => {
      let data = fxpParse('', options)
      expect(() => parser.parseDefinitions(data)).toThrowError()
    })

    it('Chyba: Tag definitions se spatnym prefixem NS.', () => {
      let data = fxpParse(`
        <definitions
          xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
          xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL"
          xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI"
          xmlns:dc="http://www.omg.org/spec/DD/20100524/DC"
          xmlns:di="http://www.omg.org/spec/DD/20100524/DI"
          xmlns:mwe="http://www.mwarcz.cz/mwe/bpmn/"
          id="Definitions_1">
        </definitions>
      `, options)

      expect(() => parser.parseDefinitions(data)).toThrowError()
    })

  })

  describe('Parse Process.', () => {
    it('Vsechny parametry', () => {
      let test = {
        id: 'a1234',
        isExecutable: true,
        versionType: VersionType.number,
        version: 11,
        processType: ProcessType.Private,
      }
      let data = fxpParse(`
        <bpmn:process id="${test.id}"
          isExecutable="${test.isExecutable}"
          processType="${test.processType}"
          mwe:versionType="${test.versionType}"
          mwe:version="${test.version}">
        </bpmn:process>
      `, options)
      parser.ns.bpmn2 = 'bpmn:'
      parser.ns.mwe = 'mwe:'

      let process = parser.parseProcess(data['bpmn:process'][0])

      expect(process.entity).toBeInstanceOf(ProcessTemplate)
      expect(process.entity.bpmnId).toEqual(test.id)
      expect(process.entity.isExecutable).toStrictEqual(test.isExecutable)
      expect(process.entity.processType).toStrictEqual(test.processType)
      expect(process.entity.versionType).toStrictEqual(test.versionType)
      expect(process.entity.version).toEqual(test.version)
    })
  })
  describe('Parse DataObject.', () => {
    it('Vsechny parametry', () => {
      let test = {
        id: 'data1',
        name: 'DATA',
        strict: false,
      }
      let data = fxpParse(`
        <bpmn:dataObject name='${test.name}' id="${test.id}" mwe:strict="${test.strict}">
        </bpmn:dataObject>
      `, options)
      parser.ns.bpmn2 = 'bpmn:'
      parser.ns.mwe = 'mwe:'

      let dataObj = parser.parseDataObject(data['bpmn:dataObject'][0])

      expect(dataObj.entity).toBeInstanceOf(DataObjectTemplate)
      expect(dataObj.entity.bpmnId).toBe(test.id)
      expect(dataObj.entity.name).toBe(test.name)
      expect(dataObj.entity.strict).toBe(test.strict)
    })
  })
  describe('Parse DataObjectReference.', () => {
    it('Vsechny parametry', () => {
      let test = {
        id: 'data1',
        dataObjectRef: 'refX',
      }
      let data = fxpParse(`
        <bpmn:dataObjectReference
          id="${test.id}"
          dataObjectRef="${test.dataObjectRef}">
        </bpmn:dataObjectReference>
      `, options)
      parser.ns.bpmn2 = 'bpmn:'
      parser.ns.mwe = 'mwe:'

      let dataObjRef = parser.parseDataObjectReference(data['bpmn:dataObjectReference'][0])

      expect(dataObjRef.refObject.bpmnId).toBe(test.id)
      expect(dataObjRef.refObject.dataObjectRef).toBe(test.dataObjectRef)
    })
  })
  describe('Parse Task.', () => {
    it('Vsechny parametry', () => {
      let test = {
        id: 'abcd',
        name: 'ABCDE',
        implementation: 'defaultTask',
      }
      let data = fxpParse(`
        <bpmn:task
          name='${test.name}'
          id="${test.id}"
          mwe:implementation="${test.implementation}">
        </bpmn:task>
      `, options)
      parser.ns.bpmn2 = 'bpmn:'
      parser.ns.mwe = 'mwe:'

      let task = parser.parseTask(data['bpmn:task'][0])

      expect(task.entity).toBeInstanceOf(NodeElementTemplate)
      expect(task.entity.bpmnId).toBe(test.id)
      expect(task.entity.name).toBe(test.name)
      expect(task.entity.implementation).toBe(test.implementation)
    })
  })
  describe('Parse ScriptTask.', () => {
    it('Vsechny parametry', () => {
      let test = {
        id: 'abcd',
        name: 'ABCDE',
        implementation: 'scriptX',
        scriptFormat: 'js',
      }
      let data = fxpParse(`
        <bpmn:scriptTask
          name='${test.name}'
          id="${test.id}"
          mwe:implementation="${test.implementation}"
          scriptFormat="${test.scriptFormat}"
          >
        </bpmn:scriptTask>
      `, options)
      parser.ns.bpmn2 = 'bpmn:'
      parser.ns.mwe = 'mwe:'

      let task = parser.parseScriptTask(data['bpmn:scriptTask'][0])

      expect(task.entity).toBeInstanceOf(NodeElementTemplate)
      expect(task.entity.bpmnId).toBe(test.id)
      expect(task.entity.name).toBe(test.name)
      expect(task.entity.implementation).toBe(test.implementation)
      // expect(task.entity.scriptFormat).toBe(test.scriptFormat)
    })
  })
  describe('Parse StartEvent.', () => {
    it('Vsechny parametry', () => {
      let test = {
        id: 'abcd',
        name: 'ABCDE',
      }
      let data = fxpParse(`
        <bpmn:startEvent
          name='${test.name}'
          id="${test.id}"
          >
        </bpmn:startEvent>
      `, options)
      parser.ns.bpmn2 = 'bpmn:'
      parser.ns.mwe = 'mwe:'

      let event = parser.parseStartEvent(data['bpmn:startEvent'][0])

      expect(event.entity).toBeInstanceOf(NodeElementTemplate)
      expect(event.entity.bpmnId).toBe(test.id)
      expect(event.entity.name).toBe(test.name)
    })
  })
  describe('Parse EndEvent.', () => {
    it('Vsechny parametry', () => {
      let test = {
        id: 'abcd',
        name: 'ABCDE',
      }
      let data = fxpParse(`
        <bpmn:endEvent
          name='${test.name}'
          id="${test.id}"
          >
        </bpmn:endtEvent>
      `, options)
      parser.ns.bpmn2 = 'bpmn:'
      parser.ns.mwe = 'mwe:'

      let event = parser.parseEndEvent(data['bpmn:endEvent'][0])

      expect(event.entity).toBeInstanceOf(NodeElementTemplate)
      expect(event.entity.bpmnId).toBe(test.id)
      expect(event.entity.name).toBe(test.name)
    })
  })
  describe('Parse SequenceFlow.', () => {
    it('Vsechny parametry', () => {
      let test = {
        id: 'abcd',
        name: 'ABCDE',
      }
      let data = fxpParse(`
        <bpmn:sequenceFlow
          name='${test.name}'
          id="${test.id}"
          >
        </bpmn:sequenceFlow>
      `, options)
      parser.ns.bpmn2 = 'bpmn:'
      parser.ns.mwe = 'mwe:'

      let seq = parser.parseSequenceFlow(data['bpmn:sequenceFlow'][0])

      expect(seq.entity).toBeInstanceOf(SequenceFlowTemplate)
      expect(seq.entity.bpmnId).toBe(test.id)
      expect(seq.entity.name).toBe(test.name)
    })
  })
  describe('Parse Gateway.', () => {
    it('Vsechny parametry', () => {
      let test = {
        id: 'abcd',
        name: 'ABCDE',
        type: '', // GatewayType.Exclusive,
        direction: '', // GatewayDirection.Mixed,
      }
      let data = fxpParse(`
        <bpmn:exclusiveGateway
          name='${test.name}'
          id="${test.id}"
          gatewayDirections="${test.direction}"
          >
        </bpmn:exclusiveGateway>
      `, options)
      parser.ns.bpmn2 = 'bpmn:'
      parser.ns.mwe = 'mwe:'

      let gateway = parser.parseGateway(data['bpmn:exclusiveGateway'][0], test.type)

      expect(gateway.entity).toBeInstanceOf(NodeElementTemplate)
      expect(gateway.entity.bpmnId).toBe(test.id)
      expect(gateway.entity.name).toBe(test.name)
      // expect(gateway.entity.type).toBe(test.type)
      // expect(gateway.entity.direction).toBe(test.direction)
    })
  })

})


describe('Testy pro parsovani dle urovne (L1, L2, aj.).', () => {
  let definitions: BpmnFxm.Definitions

  beforeEach(() => {
    parser = new Parser()
    let data = fxpParse(`
        <bpmn:definitions
          xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
          xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL"
          xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI"
          xmlns:dc="http://www.omg.org/spec/DD/20100524/DC"
          xmlns:di="http://www.omg.org/spec/DD/20100524/DI"
          xmlns:mwe="http://www.mwarcz.cz/mwe/bpmn/"
          id="Definitions_1">

        </bpmn:definitions>
      `, options)
    definitions = parser.parseDefinitions(data)
    parser.loadNamespaces(definitions)
  })

  describe('parseLevel1.', () => {

    it('Zadny proces', () => {
      let processes = parser.parseLevel1(definitions)
      expect(processes.Process).toBeArrayOfSize(0)
    })

    it('Jeden proces', () => {
      let test = {
        process: {
          id: 'P1',
          isExecutable: true,
          processType: ProcessType.Private,
          versionType: VersionType.semver,
          version: '1.1.1',
        },
      }
      let data = fxpParse(`
        <bpmn:process id="${test.process.id}"
          isExecutable="${test.process.isExecutable}"
          processType="${test.process.processType}"
          mwe:versionType="${test.process.versionType}"
          mwe:version="${test.process.version}">
        </bpmn:process>
      `, options)
      definitions = {...definitions, ...data}

      let processes = parser.parseLevel1(definitions)
      expect(processes.Process).toBeArrayOfSize(1)
      processes.Process.forEach(process => {
        expect(process.entity).toBeInstanceOf(ProcessTemplate)
        expect(process.entity.bpmnId).toBe(test.process.id)
        expect(process.entity.isExecutable).toBe(test.process.isExecutable)
        expect(process.entity.processType).toBe(test.process.processType)
        expect(process.entity.versionType).toBe(test.process.versionType)
        expect(process.entity.version).toBe(test.process.version)
      })
    })

    it('Tri procesy', () => {
      let test = {
        processes: [
          { id: 'A1', name: 'aaa' },
          { id: 'B1', name: 'bbb' },
          { id: 'C1', name: 'ccc' },
        ],
      }
      let xml = test.processes.reduce((acc, process) => {
        return acc + `
        <bpmn:process id="${process.id}"
          name="${process.name}">
        </bpmn:process>
        `
      }, '')
      let data = fxpParse(xml, options)
      definitions = { ...definitions, ...data }

      let processes = parser.parseLevel1(definitions)
      expect(processes.Process).toBeArrayOfSize(test.processes.length)
      processes.Process.forEach((process, index) => {
        expect(process.entity).toBeInstanceOf(ProcessTemplate)
        expect(process.entity.name).toBe(test.processes[index].name)
        expect(process.entity.bpmnId).toBe(test.processes[index].id)
      })
    })
  })

  describe('parseLevel2', () => {
    let process: BpmnLevel.Process

    beforeEach(() => {
      let data = fxpParse(`
        <bpmn:process id="process_1" name="PROCESS 1">
        </bpmn:process>
      `, options)
      definitions = { ...definitions, ...data }

      let queues = parser.parseLevel1(definitions)
      process = queues.Process[0]
    })
    it('Process without childs.', () => {
      let queues = parser.parseLevel2(process)
      let arr = Object.keys(queues).map(key => (queues as any)[key]).reduce((acc:any[], value) => {
        return [...acc, ...value]
      }, [])
      expect(arr).toBeArrayOfSize(0)
    })
    it('Process with dataObject.', () => {
      let test = {
        dataObject: {
          id: 'idX',
          name: 'nameX',
          json: {
            pozdrav: 'ahojda',
            cislo: 12,
            existuje: true,
          },
        },
      }
      let data = fxpParse(`
        <bpmn:dataObject name='${test.dataObject.name}' id="${test.dataObject.id}">
          <bpmn:extensionElements>
            <mwe:json>
            ${JSON.stringify(test.dataObject.json)}
            </mwe:json>
          </bpmn:extensionElements>
        </bpmn:dataObject>
      `, options)
      process.data = { ...process.data, ...data }

      let queues = parser.parseLevel2(process)
      let arr = Object.keys(queues).map(key => (queues as any)[key]).reduce((acc: any[], value) => {
        return [...acc, ...value]
      }, [])
      expect(arr).toBeArrayOfSize(1)
      expect(queues.DataObject).toBeArrayOfSize(1)
      queues.DataObject.forEach(obj => {
        expect(obj.entity.bpmnId).toBe(test.dataObject.id)
        expect(obj.entity.name).toBe(test.dataObject.name)
        expect(obj.entity.json).toMatchObject(test.dataObject.json)
      })
    })


    it('Process with XXX.', () => {
      let test = {
        dataObject: [
          {
            id: 'd1',
            name: 'nameX1',
            json: {
              pozdrav: 'ahojda',
              cislo: 12,
              existuje: true,
            },
          }, {
            id: 'd2',
            name: 'nameX2',
            json: {
              pozdrav: 'caw',
              cislo: 33,
              existuje: false,
            },
          },
        ],
        dataObjectReference: [
          { id: 'dr1', name: '', dataObjectRef: 'd1'},
        ],
        startEvent: [
          { id: 'se1', name: '' },
          { id: 'se2', name: '' },
        ],
        endEvent: [
          { id: 'ee1', name: '' },
          { id: 'ee2', name: '' },
        ],
        gateway: [
          { id: 'g1', name: '', type: 'exclusive'/*GatewayType.Exclusive*/ },
          { id: 'g2', name: '', type: 'inclusive'/*GatewayType.Inclusive*/ },
          { id: 'g3', name: '', type: 'parallel'/*GatewayType.Parallel */ },
        ],
        task: [
          {
            id: 't1', name: '',
            inputs: ['d2', 'd1'], outputs: ['d2'],
          },
        ],
        scriptTask: [
          {
            id: 'st1', name: '', script: 'console.log("ahoj");',
            inputs: ['d1'], outputs: ['dr1'],
          },
          { id: 'st2', name: '', script: undefined },
        ],
        sequenceFlow: [
          { id: 'sf1', name: '', sourceRef: 'se1', targetRef: 'ee1' },
          { id: 'sf2', name: '', sourceRef: 'se2', targetRef: 'g1' },
          { id: 'sf3', name: '', sourceRef: 'g1', targetRef: 'g2' },
          { id: 'sf4', name: '', sourceRef: 'g1', targetRef: 'ee2' },
          { id: 'sf5', name: '', sourceRef: 'g2', targetRef: 'g3' },
          { id: 'sf5', name: '', sourceRef: 'g2', targetRef: 'ee1' },
          { id: 'sf5', name: '', sourceRef: 'g3', targetRef: 'ee1' },
          { id: 'sf5', name: '', sourceRef: 'g3', targetRef: 'ee2' },
          { id: 'sf6', name: '', sourceRef: 'g3', targetRef: 'st1' },
          { id: 'sf7', name: '', sourceRef: 'st1', targetRef: 'st2' },
          { id: 'sf8', name: '', sourceRef: 'st2', targetRef: 'ee1' },
        ],
      }
      let xml = test.dataObject.reduce((acc, obj) => {
        return acc + `
          <bpmn:dataObject name="${obj.name}" id="${obj.id}">
            <bpmn:extensionElements>
              <mwe:json>
                ${JSON.stringify(obj.json)}
              </mwe:json>
            </bpmn:extensionElements>
          </bpmn:dataObject>`
      }, '') + test.dataObjectReference.reduce((acc, obj) => {
        return acc + `
          <bpmn:dataObjectReference
            id="${obj.id}"
            name="${obj.name}"
            dataObjectRef="${obj.dataObjectRef}"
          />`
      }, '') + test.startEvent.reduce((acc, obj) => {
        return acc + `
          <bpmn:startEvent id="${obj.id}" name="${obj.name}" />`
      }, '') + test.endEvent.reduce((acc, obj) => {
        return acc + `
          <bpmn:endEvent id="${obj.id}" name="${obj.name}" />`
      }, '') + test.gateway.reduce((acc, obj) => {
        return acc + `
          <bpmn:${obj.type}Gateway id="${obj.id}" name="${obj.name}">
          </bpmn${obj.type}:Gateway>`
      }, '') + test.task.reduce((acc, obj) => {
        return acc + `
          <bpmn:task id="${obj.id}" name="${obj.name}">
            ${ (!obj.inputs) ? '' :
            `<bpmn:dataInputAssociation>
              ${
            obj.inputs.reduce((acc, input) => {
              return acc + `
                    <bpmn:sourceRef>${input}</bpmn:sourceRef>`
            }, '')
            }
            </bpmn:dataInputAssociation>`}
            ${ (!obj.outputs) ? '' :
            `<bpmn:dataOutputAssociation>
              ${
            obj.outputs.reduce((acc, output) => {
              return acc + `
                    <bpmn:targetRef>${output}</bpmn:targetRef>`
            }, '')
            }
            </bpmn:dataOutputAssociation>`}
          </bpmn:task>`
      }, '') + test.scriptTask.reduce((acc, obj) => {
        return acc + `
          <bpmn:scriptTask id="${obj.id}" name="${obj.name}">
          ${ (!obj.script) ? '' :
            `<bpmn:script>
              ${obj.script}
            </bpmn:script>`}
            ${ (!obj.inputs) ? '' :
            `<bpmn:dataInputAssociation>
              ${
                obj.inputs.reduce((acc, input) => {
                  return acc + `
                    <bpmn:sourceRef>${input}</bpmn:sourceRef>`
                }, '')
              }
            </bpmn:dataInputAssociation>`}
            ${ (!obj.outputs) ? '' :
            `<bpmn:dataOutputAssociation>
              ${
            obj.outputs.reduce((acc, output) => {
              return acc + `
                    <bpmn:targetRef>${output}</bpmn:targetRef>`
            }, '')
            }
            </bpmn:dataOutputAssociation>`}
          </bpmn:scriptTask>`
      }, '') + test.sequenceFlow.reduce((acc, obj) => {
        return acc + `
          <bpmn:sequenceFlow id="${obj.id}" name="${obj.name}"
            sourceRef="${obj.sourceRef}"
            targetRef="${obj.targetRef}"
          />`
      }, '')

      let data = fxpParse(xml, options)
      process.data = { ...process.data, ...data }

      let queues = parser.parseLevel2(process)
      expect(queues.DataObject).toBeArrayOfSize(test.dataObject.length)
      expect(queues.DataObjectReference).toBeArrayOfSize(test.dataObjectReference.length)
      expect(queues.StartEvent).toBeArrayOfSize(test.startEvent.length)
      expect(queues.EndEvent).toBeArrayOfSize(test.endEvent.length)
      expect(queues.Gateway).toBeArrayOfSize(test.gateway.length)
      expect(queues.Task).toBeArrayOfSize(test.task.length)
      expect(queues.ScriptTask).toBeArrayOfSize(test.scriptTask.length)
      expect(queues.SequenceFlow).toBeArrayOfSize(test.sequenceFlow.length)

      queues.DataObject.forEach((obj, index) => {
        expect(obj.entity.processTemplate).toBe(process.entity)
        expect(obj.entity.bpmnId).toBe(test.dataObject[index].id)
        expect(obj.entity.json).toMatchObject(test.dataObject[index].json)
      })
      queues.DataObjectReference.forEach((obj, index) => {
        expect(obj.entity && obj.entity.bpmnId).toBe(test.dataObjectReference[index].dataObjectRef)
      })
      queues.StartEvent.forEach((obj, index) => {
        expect(obj.entity.processTemplate).toBe(process.entity)
        expect(obj.entity.bpmnId).toBe(test.startEvent[index].id)
      })
      queues.EndEvent.forEach((obj, index) => {
        expect(obj.entity.processTemplate).toBe(process.entity)
        expect(obj.entity.bpmnId).toBe(test.endEvent[index].id)
      })
      queues.Gateway.forEach((obj, index) => {
        expect(obj.entity.processTemplate).toBe(process.entity)
        // if (obj.entity.bpmnId === test.gateway[0].id) {
        //   expect(obj.entity.type).toBe(test.gateway[0].type)
        // } else if (obj.entity.bpmnId === test.gateway[1].id) {
        //   expect(obj.entity.type).toBe(test.gateway[1].type)
        // } else if (obj.entity.bpmnId === test.gateway[2].id) {
        //   expect(obj.entity.type).toBe(test.gateway[2].type)
        // } else {
        //   throw new Error('Neznama brana (Gateway)')
        // }
      })
      queues.Task.forEach((obj, index) => {
        expect(obj.entity.processTemplate).toBe(process.entity)
        expect(obj.entity.bpmnId).toBe(test.task[index].id)
        if (obj.entity.inputs) {
          let idMap = obj.entity.inputs.map(d => d.bpmnId)
          expect(idMap).toEqual(test.task[index].inputs)
        }
      })
      queues.ScriptTask.forEach((obj, index) => {
        expect(obj.entity.processTemplate).toBe(process.entity)
        expect(obj.entity.bpmnId).toBe(test.scriptTask[index].id)
        // expect(obj.entity.script).toBe(test.scriptTask[index].script)
      })
      queues.SequenceFlow.forEach((obj, index) => {
        expect(obj.entity.processTemplate).toBe(process.entity)
        expect(obj.entity.bpmnId).toBe(test.sequenceFlow[index].id)
      })

    })

  })
})
