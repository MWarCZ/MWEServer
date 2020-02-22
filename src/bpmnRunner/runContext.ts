import { Connection, Equal, In } from 'typeorm'

import {
  ActivityStatus,
  DataObjectInstance,
  DataObjectTemplate,
  NodeElementInstance,
  NodeElementTemplate,
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

export type RunContextIncoming = { id: number, came: boolean, flag: string }[]
export type RunContextOutgoing = { id: number, expression: string, flag: string }[]

export type RunContextNodeElement = {
  // Z instance
  startDateTime: Date,
  endDateTime: Date,
  status: ActivityStatus,
  // Ze sablony
  name: string,
  bpmnId: string,
  implementation: string,
}

export type RunContext = {
  $GLOBAL: any,
  $INCOMING: RunContextIncoming,
  $OUTGOING: RunContextOutgoing,
  $INPUT: RunContextInput,
  $OUTPUT: RunContextOutput,
  $SELF: Partial<RunContextNodeElement>,
}

//#endregion

//#region Funkce CreateXXX

export function createEmptyContext(): RunContext {
  return {
    $GLOBAL: {},
    $INPUT: {},
    $OUTPUT: {},
    $SELF: {},
    $INCOMING: [],
    $OUTGOING: [],
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
): RunContextIncoming {
  const {
    incomingSequenceTemplates,
    incomingSequenceInstances,
  } = options

  let incomingIds = incomingSequenceInstances.map(incomingInstance => {
    let id = incomingInstance.templateId || (incomingInstance.template && incomingInstance.template.id)
    return id
  }).filter(x => !!x) as number[]

  let data: RunContextIncoming = incomingSequenceTemplates.map(incomingTemplate => {
    const {id = -1, flag = ''} = incomingTemplate
    return { id, came: incomingIds.includes(id), flag }
  })

  return data
}

export function createContextOutgoing(
  options: {
    outgoingSequenceTemplates: SequenceFlowTemplate[],
  },
): RunContextOutgoing {
  const {
    outgoingSequenceTemplates,
  } = options

  let data: RunContextOutgoing = outgoingSequenceTemplates.map(outgoingTemplate => {
    const { targetId: id = -1, expression = 'true', flag = '' } = outgoingTemplate
    return { id, expression, flag }
  })

  return data
}


export function createContextForNode(
  options: {
    nodeTemplate: NodeElementTemplate,
    nodeInstance: NodeElementInstance,
    inputsDataTemplates: DataObjectTemplate[],
    inputsDataInstances: DataObjectInstance[],
    outputsDataTemplates: DataObjectTemplate[],
    outputsDataInstances: DataObjectInstance[],
    incomingSequenceTemplates: SequenceFlowTemplate[],
    incomingSequenceInstances: SequenceFlowInstance[],
    outgoingSequenceTemplates: SequenceFlowTemplate[],
    context?: RunContext,
  },
): RunContext {
  const {
    nodeTemplate,
    nodeInstance,
    inputsDataTemplates,
    inputsDataInstances,
    outputsDataTemplates,
    outputsDataInstances,
    outgoingSequenceTemplates,
    incomingSequenceTemplates,
    incomingSequenceInstances,
    context = createEmptyContext(),
  } = options
  let {
    startDateTime,
    endDateTime,
    status,
  } = nodeInstance
  let {
    name,
    bpmnId,
    implementation,
  } = nodeTemplate

  context.$SELF = {
    startDateTime,
    endDateTime,
    status,
    bpmnId,
    name,
    implementation,
  }

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


export async function loadContextForNodeElement(
  taskInstance: { id: number },
  typeormConnection: Connection,
): Promise<RunContext>  {
  // [x] Ziskat instanci ulohy.
  // [x] Ziskat sablonu ulohy.
  // [x] Ziskat datove vstupy dane sablony ulohy.
  // [x] Ziskat existujici instance datovych vstupu.
  //    [x] Stejna instance procesu pro instanci ulohy a instance datoveho objektu.
  //    [x] Instance datoveho objektu je vytvorena dle sablon datovych vstupu sablony ulohy.
  //
  let context: RunContext = createEmptyContext()
  let taskI = await typeormConnection.getRepository(NodeElementInstance).findOneOrFail(taskInstance.id, {
    relations: [
      'template',
      'template.inputs', 'template.outputs',
      'template.outgoing', 'template.incoming',
    ],
  })
  // console.log(JSON.stringify(taskI, null, 2))

  if (taskI && taskI.template) {
    let inputsDataTemplates: DataObjectTemplate[] = []
    let inputsDataInstances: DataObjectInstance[] = []
    let outputsDataTemplates: DataObjectTemplate[] = []
    let outputsDataInstances: DataObjectInstance[] = []
    let incomingSequenceTemplates: SequenceFlowTemplate[] = []
    let incomingSequenceInstances: SequenceFlowInstance[] = []
    let outgoingSequenceTemplates: SequenceFlowTemplate[] = []

    if (taskI.template.inputs) {
      inputsDataTemplates = taskI.template.inputs
      inputsDataInstances = await loadFilteredDataInstances({
        typeormConnection,
        processInstanceId: taskI.processInstanceId as number,
        dataTemplates: inputsDataTemplates,
      })

    }
    if (taskI.template.outputs) {
      outputsDataTemplates = taskI.template.outputs
      outputsDataInstances = await loadFilteredDataInstances({
        typeormConnection,
        processInstanceId: taskI.processInstanceId as number,
        dataTemplates: outputsDataTemplates,
      })
    }

    if (taskI.template.outgoing) {
      outgoingSequenceTemplates = taskI.template.outgoing
        .filter(x => !!x) as SequenceFlowTemplate[]
    }
    if (taskI.template.incoming) {
      incomingSequenceTemplates = taskI.template.incoming
        .filter(x => !!x) as SequenceFlowTemplate[]
      incomingSequenceInstances = await loadFilteredSequenceInstances({
        typeormConnection,
        processInstanceId: taskI.processInstanceId as number,
        sequenceTemplates: incomingSequenceTemplates,
      })
    }

    context = createContextForNode({
      context,
      nodeTemplate: taskI.template,
      nodeInstance: taskI,
      inputsDataTemplates,
      inputsDataInstances,
      outputsDataTemplates,
      outputsDataInstances,
      incomingSequenceTemplates,
      incomingSequenceInstances,
      outgoingSequenceTemplates,
    })
  }
  // console.log(JSON.stringify(context, null, 2))
  return context
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
