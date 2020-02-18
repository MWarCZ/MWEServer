import 'jest-extended'

import * as InitHelpers from '../../src/bpmnRunner/initHelpers'
import {
  DataObjectInstance,
  DataObjectTemplate,
  NodeElementInstance,
  NodeElementTemplate,
  ProcessInstance,
  ProcessTemplate,
  SequenceFlowInstance,
  SequenceFlowTemplate,
} from '../../src/entity/bpmn'


describe('Testy funkci v InitHelpers: Se sablonou procesu.', () => {
  let processTemplate: ProcessTemplate

  beforeEach(async () => {
    processTemplate = new ProcessTemplate({
      isExecutable: true,
      name: 'Process A',
    })
    processTemplate.id = 123
  })

  it('initNewProcess', () => {
    let instance = InitHelpers.initNewProcess(processTemplate)
    expect(instance).toBeInstanceOf(ProcessInstance)
    expect(instance.processTemplate).toMatchObject(processTemplate)
  })

  describe('Testy s instanci procesu.', () => {
    let processInstance: ProcessInstance

    beforeEach(async () => {
      processInstance = InitHelpers.initNewProcess(processTemplate)
      processInstance.id = 234
    })

    it('initNewNodeElement', () => {
      let startEvent = new NodeElementTemplate({implementation: 'startEvent'})
      startEvent.processTemplate = processTemplate
      startEvent.name = 'Start A'
      startEvent.id = 345

      let instance = InitHelpers.initNewNodeElement(processInstance, startEvent)
      expect(instance).toBeInstanceOf(NodeElementInstance)
      expect(instance.template).toMatchObject(startEvent)
      expect(instance.processInstance).toMatchObject(processInstance)
    })

    it('initNewDataObjetct', () => {
      let dataObject = new DataObjectTemplate()
      dataObject.processTemplate = processTemplate
      dataObject.name = 'DataObject A'
      dataObject.id = 345
      dataObject.json = { xxx:1, str: 'abc' }

      let instance = InitHelpers.initNewDataObject(processInstance, dataObject)
      expect(instance).toBeInstanceOf(DataObjectInstance)
      expect(instance.template).toMatchObject(dataObject)
      expect(instance.processInstance).toMatchObject(processInstance)
      expect(instance.data).toMatchObject(dataObject.json)
    })

    it('initNewSequenceFlow', () => {
      let sequence = new SequenceFlowTemplate()
      sequence.processTemplate = processTemplate
      sequence.name = 'Spoj A'
      sequence.id = 345

      let instance = InitHelpers.initNewSequenceFlow(processInstance, sequence)
      expect(instance).toBeInstanceOf(SequenceFlowInstance)
      expect(instance.template).toMatchObject(sequence)
      expect(instance.processInstance).toMatchObject(processInstance)
    })

    describe('Testy chybovych stavu.', ()=>{
      // TODO Predelat tyto podtesty!
      it('Chyba: Sablone elementu chybi odkaz na sablonu procesu.', ()=>{
        let dataObject = new DataObjectTemplate()
        dataObject.name = 'DataObject A'
        dataObject.id = 345
        dataObject.json = { xxx: 1, str: 'abc' }

        expect(() => InitHelpers.initNewDataObject(processInstance, dataObject)).toThrowError()
      })
      it('Chyba: Sablone elementu chybi odkaz na jinou sablonu procesu.', () => {
        let dataObject = new DataObjectTemplate()
        dataObject.processTemplateId = 1010
        dataObject.name = 'DataObject A'
        dataObject.id = 345
        dataObject.json = { xxx: 1, str: 'abc' }

        expect(() => InitHelpers.initNewDataObject(processInstance, dataObject)).toThrowError()
      })
    })

  })

})
