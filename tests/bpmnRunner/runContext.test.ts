import 'jest-extended'

import * as RunContext from '../../src/bpmnRunner/runContext'
import { DataObjectInstance, DataObjectTemplate, SequenceFlowInstance, SequenceFlowTemplate } from '../../src/entity/bpmn'

describe('Testy s RunContext: synchronni funkce', () => {

  it('createEmptyContext', () => {
    let context = RunContext.createEmptyContext()
    expect(context.$GLOBAL).toMatchObject({})
    expect(context.$SELF).toMatchObject({})
    expect(context.$INPUT).toMatchObject({})
    expect(context.$OUTPUT).toMatchObject({})
  })

  describe('createContextInputs', () => {

    it('Zdadny vstup', () => {
      let context = RunContext.createContextInputs({
        inputsDataInstances: [],
        inputsDataTemplates: [],
      })
      expect(context).toMatchObject({})
    })
    it('Vstup: 1x DataObjectTemplate', () => {
      const dataT = new DataObjectTemplate({
        id: 1,
        name: 'Data1',
        json: [11, 22, 33],
      })
      let context = RunContext.createContextInputs({
        inputsDataInstances: [],
        inputsDataTemplates: [dataT],
      })
      expect(context).toMatchObject({ Data1: [11, 22, 33]})
    })
    it('Vstup: 3x DataObjectTemplate', () => {
      const dataT = [
        new DataObjectTemplate({ id: 11, name: 'Data1', json: 'ahoj' }),
        new DataObjectTemplate({ id: 22, name: 'Data2', json: 'caw' }),
        new DataObjectTemplate({ id: 33, name: 'Data3', json: 'nazdar' }),
      ]
      let context = RunContext.createContextInputs({
        inputsDataInstances: [],
        inputsDataTemplates: [...dataT],
      })
      expect(context).toMatchObject({
        Data1: 'ahoj', Data2: 'caw', Data3: 'nazdar',
      })
    })
    it('Vstup: 2x DataObjectTemplate se stejnym jsmenem', () => {
      const dataT = [
        new DataObjectTemplate({ id: 11, name: 'Data1', json: 'ahoj' }),
        new DataObjectTemplate({ id: 22, name: 'Data1', json: 'caw' }),
      ]
      let context = RunContext.createContextInputs({
        inputsDataInstances: [],
        inputsDataTemplates: [...dataT],
      })
      expect(context).toMatchObject({
        Data1: 'caw',
      })
    })
    it('Vstup: 1x DataObjectTemplate s patrici 1x DataObjectIntance', () => {
      const dataT = [
        new DataObjectTemplate({ id: 11, name: 'Data1', json: 'ahoj'}),
      ]
      const dataI = [
        new DataObjectInstance({ id: 1, templateId: 11, data: 'caw'}),
      ]
      let context = RunContext.createContextInputs({
        inputsDataInstances: [...dataI],
        inputsDataTemplates: [...dataT],
      })
      expect(context).toMatchObject({
        Data1: 'caw',
      })
    })
    it('Vstup: 2x DataObjectTemplate s patrici 1x DataObjectIntance', () => {
      const dataT = [
        new DataObjectTemplate({ id: 22, name: 'Data2', json: 'xxx' }),
        new DataObjectTemplate({ id: 11, name: 'Data1', json: 'ahoj' }),
      ]
      const dataI = [
        new DataObjectInstance({ id: 1, templateId: 11, data: 'caw' }),
      ]
      let context = RunContext.createContextInputs({
        inputsDataInstances: [...dataI],
        inputsDataTemplates: [...dataT],
      })
      expect(context).toMatchObject({
        Data1: 'caw',
        Data2: 'xxx',
      })
    })
    it('Vstup: 1x DataObjectTemplate s nepatrici 3x DataObjectIntance', () => {
      // prezije jen jedno
      const dataT = [
        new DataObjectTemplate({ id: 11, name: 'Data1', json: 'ahoj' }),
      ]
      const dataI = [
        new DataObjectInstance({ id: 1, templateId: undefined, data: 'undefined' }),
        new DataObjectInstance({ id: 2, templateId: 1, data: '1' }),
        new DataObjectInstance({ id: 3, templateId: 111, data: '111' }),
      ]
      let context = RunContext.createContextInputs({
        inputsDataInstances: [...dataI],
        inputsDataTemplates: [...dataT],
      })
      expect(context).toMatchObject({
        Data1: 'ahoj',
      })
    })

  })
  describe('createContextOutputs', () => {
    it('Komplexni test', () => {
      // prezije jen jedno
      const dataT = [
        new DataObjectTemplate({ id: 11, name: 'Data1', json: 'ahoj' }),
        new DataObjectTemplate({ id: 12, name: 'Data2', json: 'caw' }),
        new DataObjectTemplate({ id: 13, name: 'Data3', json: 'nazdar' }),
        new DataObjectTemplate({ id: 14, name: 'Data3', json: 'zdar' }),
      ]
      const dataI = [
        new DataObjectInstance({ id: 1, templateId: undefined, data: 'undefined' }),
        new DataObjectInstance({ id: 2, templateId: 1, data: '1' }),
        new DataObjectInstance({ id: 3, templateId: 12, data: 'novy caw' }),
      ]
      let context = RunContext.createContextOutputs({
        outputsDataInstances: [...dataI],
        outputsDataTemplates: [...dataT],
      })
      expect(context).toMatchObject({
        Data1: 'ahoj',
        Data2: 'novy caw',
        Data3: 'zdar',
      })
    })
  })

  describe('createContextIncoming', () => {

    it('Zadne prichozi sekvence', () => {
      let context = RunContext.createContextIncoming({
        incomingSequenceTemplates: [],
        incomingSequenceInstances: [],
      })
      expect(context).toBeArrayOfSize(0)
    })
    it('Vstup: 2x SequenceTemplate', () => {
      let sequences = [
        new SequenceFlowTemplate({ id: 1 }),
        new SequenceFlowTemplate({ id: 2 }),
      ]
      let context = RunContext.createContextIncoming({
        incomingSequenceTemplates: [...sequences],
        incomingSequenceInstances: [],
      })
      expect(context).toBeArrayOfSize(2)
      expect(context).toMatchObject([
        { id: 1, came: false },
        { id: 2, came: false },
      ])
    })
    it('Vstup: 2x SequenceTemplate s patrici 1x SequenceInstance', () => {
      let sequences = [
        new SequenceFlowTemplate({ id: 1 }),
        new SequenceFlowTemplate({ id: 2 }),
      ]
      let instances = [
        new SequenceFlowInstance({ id: 11, templateId: 2 }),
      ]
      let context = RunContext.createContextIncoming({
        incomingSequenceTemplates: [...sequences],
        incomingSequenceInstances: [...instances],
      })
      expect(context).toBeArrayOfSize(2)
      expect(context).toMatchObject([
        { id: 1, came: false },
        { id: 2, came: true },
      ])
    })
    it('Vstup: 2x SequenceTemplate s nepatrici 3x SequenceInstance', () => {
      let sequences = [
        new SequenceFlowTemplate({ id: 1 }),
        new SequenceFlowTemplate({ id: 2 }),
      ]
      let instances = [
        new SequenceFlowInstance({ id: 11, templateId: undefined }),
        new SequenceFlowInstance({ id: 12, templateId: 11 }),
        new SequenceFlowInstance({ id: 13, templateId: 22 }),
      ]
      let context = RunContext.createContextIncoming({
        incomingSequenceTemplates: [...sequences],
        incomingSequenceInstances: [...instances],
      })
      expect(context).toBeArrayOfSize(2)
      expect(context).toMatchObject([
        { id: 1, came: false },
        { id: 2, came: false },
      ])
    })

  })

  describe('createContextOutgoing', () => {

    it('Zadne odchozi sekvence', () => {
      let context = RunContext.createContextOutgoing({
        outgoingSequenceTemplates: [],
      })
      expect(context).toBeArrayOfSize(0)
    })
    it('Vstup: 1x SequenceFlowTemplate', () => {
      let sequences: SequenceFlowTemplate[] = [
        new SequenceFlowTemplate({id:1, expression: 'true', targetId: 22}),
      ]
      let context = RunContext.createContextOutgoing({
        outgoingSequenceTemplates: [...sequences],
      })
      expect(context).toBeArrayOfSize(1)
      expect(context).toMatchObject([{id:22, expression:'true'}])
    })
    it('Vstup: 3x SequenceFlowTemplate', () => {
      let sequences: SequenceFlowTemplate[] = [
        new SequenceFlowTemplate({ id: 1, expression: 'true', targetId: 22 }),
        new SequenceFlowTemplate({ id: 11, expression: '1===1', targetId: 33 }),
        new SequenceFlowTemplate({ id: 2, expression: '2=="2"', targetId: 44 }),
      ]
      let context = RunContext.createContextOutgoing({
        outgoingSequenceTemplates: [...sequences],
      })
      expect(context).toBeArrayOfSize(3)
      expect(context).toMatchObject([
        { id: 22, expression: 'true' },
        { id: 33, expression: '1===1' },
        { id: 44, expression: '2=="2"' },
      ])
    })

  })

  describe('createContextForStartEvent', () => {

  })

  describe('createContextForEndEvent', () => {

  })

  describe('createContextForBasicTask', () => {

  })

})
