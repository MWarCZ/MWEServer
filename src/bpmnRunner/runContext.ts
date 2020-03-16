import { Connection, Equal, In } from 'typeorm'

import {
  ActivityStatus,
  DataObjectInstance,
  DataObjectTemplate,
  NodeElementInstance,
  NodeElementTemplate,
  ProcessInstance,
  SequenceFlowInstance,
  SequenceFlowTemplate,
} from '../entity/bpmn'
import { JsonMap } from '../types/json'

////////////////////////////
// createXXX - synchroni funkce, ktere nepracuji primo s databazi.
// loadXXX - asynchroni funkce, ktere pracuji primo s databozi.
//

//#region Typy

export type RunContextMap = {
  [key: string]: any,
}
export type RunContextInput = RunContextMap
export type RunContextOutput = RunContextMap

export type RunContextIncoming = { id: number, came: boolean, flag: string }
export type RunContextOutgoing = { id: number, expression: string, flag: string }

export type RunContextNodeElement = {
  // Z instance
  id: number,
  startDateTime: Date | null,
  endDateTime: Date | null,
  status: ActivityStatus,
  // Ze sablony
  name: string,
  bpmnId: string,
  implementation: string,
}

export interface RunContextProvideNodes {
  id: number,
  bpmnId: string,
  name: string,
  implementation: string,
  data: JsonMap,
}

export type RunContext = {
  // Data ulozena v registru instance procesu.
  $GLOBAL: JsonMap,
  // Data ulozena v registru instance uzlu.
  $LOCAL: JsonMap,
  // Info o prichozich tocich.
  $INCOMING: RunContextIncoming[],
  // Info o odchozich tocich.
  $OUTGOING: RunContextOutgoing[],
  // Data vstupu.
  $INPUT: RunContextInput,
  // Data vystupu.
  $OUTPUT: RunContextOutput,
  // Vytazek informaci o uzlu (z instance a sablony).
  $SELF: Partial<RunContextNodeElement>,
  // Vytazek sablon uzlu, ke kterym ma implementace pristup.
  $NODES: RunContextProvideNodes[],
}

//#endregion

//#region Funkce CreateXXX

export function createEmptyContext(): RunContext {
  return {
    $GLOBAL: {},
    $LOCAL: {},
    $INPUT: {},
    $OUTPUT: {},
    $SELF: {},
    $INCOMING: [],
    $OUTGOING: [],
    $NODES: [],
  }
}

export function createContextInputs(
  options: {
    inputsDataTemplates: DataObjectTemplate[],
    inputsDataInstances: DataObjectInstance[],
  },
): RunContextInput {
  const {
    inputsDataTemplates: taskInputsTemplates,
    inputsDataInstances: taskInputsInstances,
  } = options

  let data: RunContextInput  = taskInputsTemplates.map(inputTemplate => {
    const { name = '', json } = inputTemplate
    let inputInstance = taskInputsInstances.find(dataInstance => dataInstance.templateId === inputTemplate.id)
    return {
      // Data z instance maji prednost pred daty z sablony
      [name]: (inputInstance) ? inputInstance.data : json,
      [name]: (inputInstance) ? JSON.parse(JSON.stringify(inputInstance.data))
        : JSON.parse(JSON.stringify(json))
    }
  }).reduce((acc: any, value) => {
    return {
      ...acc,
      ...value,
    }
  }, {})
  return data
}

export function createContextOutputs(
  options: {
    outputsDataTemplates: DataObjectTemplate[],
    outputsDataInstances: DataObjectInstance[],
  },
): RunContextOutput {
  const {
    outputsDataTemplates: taskOutputsTemplates,
    outputsDataInstances: taskOutputsInstances,
  } = options
  let data = createContextInputs({
    inputsDataTemplates: taskOutputsTemplates,
    inputsDataInstances: taskOutputsInstances,
  })
  return data
}

export function createContextIncoming(
  options: {
    incomingSequenceTemplates: SequenceFlowTemplate[],
    incomingSequenceInstances: SequenceFlowInstance[],
  },
): RunContextIncoming[] {
  const {
    incomingSequenceTemplates,
    incomingSequenceInstances,
  } = options

  let incomingIds = incomingSequenceInstances.map(incomingInstance => {
    let id = incomingInstance.templateId || (incomingInstance.template && incomingInstance.template.id)
    return id
  }).filter(x => !!x) as number[]

  let data: RunContextIncoming[] = incomingSequenceTemplates.map(incomingTemplate => {
    const {id = -1, flag = ''} = incomingTemplate
    return { id, came: incomingIds.includes(id), flag }
  })

  return data
}

export function createContextOutgoing(
  options: {
    outgoingSequenceTemplates: SequenceFlowTemplate[],
  },
): RunContextOutgoing[] {
  const {
    outgoingSequenceTemplates,
  } = options

  let data: RunContextOutgoing[] = outgoingSequenceTemplates.map(outgoingTemplate => {
    const { targetId: id = -1, expression = 'true', flag = '' } = outgoingTemplate
    return { id, expression, flag }
  })

  return data
}

export function createContextForNode(
  options: {
    nodeTemplate: NodeElementTemplate,
    nodeInstance: NodeElementInstance,
    processInstance: ProcessInstance,
    inputsDataTemplates: DataObjectTemplate[],
    inputsDataInstances: DataObjectInstance[],
    outputsDataTemplates: DataObjectTemplate[],
    outputsDataInstances: DataObjectInstance[],
    incomingSequenceTemplates: SequenceFlowTemplate[],
    incomingSequenceInstances: SequenceFlowInstance[],
    outgoingSequenceTemplates: SequenceFlowTemplate[],
    context?: RunContext,
    provideNodeTemplates: RunContextProvideNodes[],
  },
): RunContext {
  const {
    nodeTemplate,
    nodeInstance,
    processInstance,
    inputsDataTemplates,
    inputsDataInstances,
    outputsDataTemplates,
    outputsDataInstances,
    outgoingSequenceTemplates,
    incomingSequenceTemplates,
    incomingSequenceInstances,
    context = createEmptyContext(),
    provideNodeTemplates,
  } = options
  const {
    id = -1,
    startDateTime,
    endDateTime,
    status,
  } = nodeInstance
  const {
    name,
    bpmnId,
    implementation,
  } = nodeTemplate

  context.$SELF = {
    id,
    startDateTime,
    endDateTime,
    status,
    bpmnId,
    name,
    implementation,
  }

  // context.$GLOBAL = {
  //   ...processInstance.data,
  // }
  context.$GLOBAL = JSON.parse(JSON.stringify(processInstance.data))

  // context.$LOCAL = {
  //   ...nodeInstance.data,
  // }
  context.$LOCAL = JSON.parse(JSON.stringify(nodeInstance.data))

  context.$NODES = [...provideNodeTemplates]

  let inputsData = createContextInputs({
    inputsDataInstances,
    inputsDataTemplates,
  })
  context.$INPUT = { ...context.$INPUT, ...inputsData }

  let outputsData = createContextOutputs({
    outputsDataInstances,
    outputsDataTemplates,
  })
  context.$OUTPUT = { ...context.$OUTPUT, ...outputsData }

  let outgoing = createContextOutgoing({ outgoingSequenceTemplates })
  context.$OUTGOING = [ ...context.$OUTGOING, ...outgoing ]

  let incoming = createContextIncoming({incomingSequenceInstances, incomingSequenceTemplates})
  context.$INCOMING = [ ...context.$INCOMING, ...incoming ]

  // console.log(JSON.stringify(context, null, 4))
  return context
}

//#endregion

//#region Funkce LoacXXX

export async function loadFilteredDataInstances(options: {
  typeormConnection: Connection,
  dataTemplates: DataObjectTemplate[],
  processInstanceId: number,
}): Promise<DataObjectInstance[]> {
  const {
    typeormConnection,
    dataTemplates,
    processInstanceId,
  } = options

  if (dataTemplates.length <= 0) return []

  let dataTemplatesIds = dataTemplates.map(d => d.id)
  // DataObjectInstance patrici do instance procesu a zaroven do mnoziny vstupu ulohy
  let dataInstances = await typeormConnection.getRepository(DataObjectInstance).find({
    processInstanceId: Equal(processInstanceId),
    templateId: In([...dataTemplatesIds]),
  })
  return dataInstances
}

export async function loadFilteredSequenceInstances(options: {
  typeormConnection: Connection,
  sequenceTemplates: SequenceFlowTemplate[],
  processInstanceId: number,
}): Promise<SequenceFlowInstance[]> {
  const {
    typeormConnection,
    sequenceTemplates,
    processInstanceId,
  } = options

  if (sequenceTemplates.length <= 0) return []

  let sequenceTemplatesIds = sequenceTemplates.map(d => d.id)
  // DataObjectInstance patrici do instance procesu a zaroven do mnoziny vstupu ulohy
  let sequenceInstances = await typeormConnection.getRepository(SequenceFlowInstance).find({
    processInstanceId: Equal(processInstanceId),
    templateId: In([...sequenceTemplatesIds]),
  })
  return sequenceInstances
}

export function convertToProvideNodes(options: {
  nodeTemplates: NodeElementTemplate[],
}): RunContextProvideNodes[] {
  return options.nodeTemplates.map(node => {
    return {
      id: node.id || 0,
      bpmnId: node.bpmnId || '',
      name: node.name || '',
      implementation: node.implementation || '',
      data: node.data,
    }
  })
}

//#endregion


export function createArgs(options:{
  nodeTemplate: NodeElementTemplate,
  nodeInstance: NodeElementInstance,
  otherArgs: JsonMap,
}) {
  const {
    nodeInstance, nodeTemplate, otherArgs,
  } = options
  let x = nodeTemplate.data
  let y = nodeInstance.returnValue
  let z = otherArgs
  let xyz = {
    ...x,
    ...z,
    $RETURN: y,
  }
}
