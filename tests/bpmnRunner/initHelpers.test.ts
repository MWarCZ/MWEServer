import 'jest-extended'

import * as InitHelpers from '../../src/bpmnRunner/initHelpers'
import {
  DataObjectInstance,
  DataObjectTemplate,
  EndEventInstance,
  EndEventTemplate,
  GatewayInstance,
  GatewayTemplate,
  ProcessInstance,
  ProcessTemplate,
  ScriptTaskInstance,
  StartEventInstance,
  StartEventTemplate,
  TaskInstance,
  TaskTemplate,
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

    it('initNewStartEvent', () => {
      let startEvent = new StartEventTemplate()
      startEvent.processTemplate = processTemplate
      startEvent.name = 'Start A'
      startEvent.id = 345

      let instance = InitHelpers.initNewStartEvent(processInstance, startEvent)
      expect(instance).toBeInstanceOf(StartEventInstance)
      expect(instance.template).toMatchObject(startEvent)
      expect(instance.processInstance).toMatchObject(processInstance)
    })

    it('initNewEndEvent', () => {
      let endEvent = new EndEventTemplate()
      endEvent.processTemplate = processTemplate
      endEvent.name = 'End A'
      endEvent.id = 345

      let instance = InitHelpers.initNewEndEvent(processInstance, endEvent)
      expect(instance).toBeInstanceOf(EndEventInstance)
      expect(instance.template).toMatchObject(endEvent)
      expect(instance.processInstance).toMatchObject(processInstance)
    })

    it('initNewGateway', () => {
      let gateway = new GatewayTemplate()
      gateway.processTemplate = processTemplate
      gateway.name = 'Gateway A'
      gateway.id = 345

      let instance = InitHelpers.initNewGateway(processInstance, gateway)
      expect(instance).toBeInstanceOf(GatewayInstance)
      expect(instance.template).toMatchObject(gateway)
      expect(instance.processInstance).toMatchObject(processInstance)
    })

    it('initNewTask', () => {
      let task = new TaskTemplate()
      task.processTemplate = processTemplate
      task.name = 'Task A'
      task.id = 345

      let instance = InitHelpers.initNewTask(processInstance, task)
      expect(instance).toBeInstanceOf(TaskInstance)
      expect(instance.template).toMatchObject(task)
      expect(instance.processInstance).toMatchObject(processInstance)
    })

    it('initNewScriptTask', () => {
      let task = new TaskTemplate()
      task.processTemplate = processTemplate
      task.name = 'ScriptTask A'
      task.id = 345

      let instance = InitHelpers.initNewScriptTask(processInstance, task)
      expect(instance).toBeInstanceOf(ScriptTaskInstance)
      expect(instance.template).toMatchObject(task)
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
