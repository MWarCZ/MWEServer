import { options } from 'bpmnBuilder/fxp.config'
import { Connection, Equal, In } from 'typeorm'

import {
  ActivityStatus,
  BasicTaskInstance,
  BasicTaskTemplate,
  DataObjectInstance,
  DataObjectTemplate,
  EndEventInstance,
  StartEventInstance,
  StartEventTemplate,
} from '../entity/bpmn'

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
export type RunContextTask = {
  // Z instance
  startDate: Date,
  endData: Date,
  status: ActivityStatus,
  // Ze sablony
  name: string,
  bpmnId: string,
  implementation: string,
}
export type RunContextStartEvent = {
  // Z instance
  startDateTime: Date,
  endDateTime: Date,
  status: ActivityStatus,
  // Ze sablony
  name: string,
  bpmnId: string,
}

export type RunContext = {
  $GLOBAL: any,
  $INPUT: RunContextInput,
  $OUTPUT: RunContextOutput,
  $SELF: Partial<RunContextTask> | Partial<RunContextStartEvent>,
}

//#endregion

//#region Funkce CreateXXX

export function createEmptyContext(): RunContext {
  return {
    $GLOBAL: {},
    $INPUT: {},
    $OUTPUT: {},
    $SELF: {},
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



export function createContextForStartEvent(
  options: {
    eventTemplate: StartEventTemplate,
    eventInstance: StartEventInstance,
    outputsDataTemplates: DataObjectTemplate[],
    outputsDataInstances: DataObjectInstance[],
    context?: RunContext,
  },
): RunContext {
  const {
    eventTemplate,
    eventInstance,
    outputsDataTemplates,
    outputsDataInstances,
    context = createEmptyContext(),
  } = options
  let {
    startDateTime,
    endDateTime,
    status,
  } = eventInstance
  let {
    name,
    bpmnId,
   } = eventTemplate

  context.$SELF = {
    startDateTime,
    endDateTime,
    status,
    bpmnId,
    name,
  }

  let outputsData = createContextOutputs({
    outputsDataInstances,
    outputsDataTemplates,
  })
  context.$OUTPUT = { ...context.$OUTPUT, ...outputsData }

  return context
}

export function createContextForEndEvent(
  options: {
    eventTemplate: StartEventTemplate,
    eventInstance: StartEventInstance,
    inputsDataTemplates: DataObjectTemplate[],
    inputsDataInstances: DataObjectInstance[],
    context?: RunContext,
  },
): RunContext {
  const {
    eventTemplate,
    eventInstance,
    inputsDataTemplates,
    inputsDataInstances,
    context = createEmptyContext(),
  } = options

  let {
    startDateTime,
    endDateTime,
    status,
  } = eventInstance
  let {
    name,
    bpmnId,
  } = eventTemplate

  context.$SELF = {
    startDateTime,
    endDateTime,
    status,
    bpmnId,
    name,
  }

  let inputsData = createContextInputs({
    inputsDataInstances,
    inputsDataTemplates,
  })
  context.$INPUT = { ...context.$INPUT, ...inputsData }

  return context
}


export function createContextForBasicTask(
  options: {
    taskTemplate: BasicTaskTemplate,
    taskInstance: BasicTaskInstance,
    inputsDataTemplates: DataObjectTemplate[],
    inputsDataInstances: DataObjectInstance[],
    outputsDataTemplates: DataObjectTemplate[],
    outputsDataInstances: DataObjectInstance[],
    context?: RunContext,
  },
): RunContext {
  const {
    taskTemplate,
    taskInstance,
    inputsDataTemplates,
    inputsDataInstances,
    outputsDataTemplates,
    outputsDataInstances,
    context = createEmptyContext(),
  } = options
  let {
    startDateTime,
    endDateTime,
    status,
  } = taskInstance
  let {
    name,
    bpmnId,
    implementation,
  } = taskTemplate

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
  let dataTemplatesIds = dataTemplates.map(d => d.id)
  // DataObjectInstance patrici do instance procesu a zaroven do mnoziny vstupu ulohy
  let dataInstances = await typeormConnection.getRepository(DataObjectInstance).find({
    processInstanceId: Equal(processInstanceId),
    templateId: In([...dataTemplatesIds]),
  })
  return dataInstances
}


export async function loadContextForBasicTask(
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

  let taskI = await typeormConnection.getRepository(BasicTaskInstance).findOneOrFail(taskInstance.id, {
    relations: ['template', 'template.inputs', 'template.outputs'],
  })
  // console.log(JSON.stringify(taskI, null, 2))

  if (taskI && taskI.template) {
    let inputsDataTemplates: DataObjectTemplate[] = []
    let inputsDataInstances: DataObjectInstance[] = []
    let outputsDataTemplates: DataObjectTemplate[] = []
    let outputsDataInstances: DataObjectInstance[] = []

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
    context = createContextForBasicTask({
      context,
      taskTemplate: taskI.template,
      taskInstance: taskI,
      inputsDataTemplates,
      inputsDataInstances,
      outputsDataTemplates,
      outputsDataInstances,
    })
  }
  // console.log(JSON.stringify(context, null, 2))
  return context
}

export async function loadContextForTask(
  taskInstance: { id: number },
  typeormConnection: Connection,
): Promise<RunContext> {
  return loadContextForBasicTask(taskInstance, typeormConnection)
}

export async function loadContextForScriptTask(
  taskInstance: { id: number },
  typeormConnection: Connection,
): Promise<RunContext> {
  return loadContextForBasicTask(taskInstance, typeormConnection)
}

export async function loadContextForStartEvent(
  eventInstance: { id: number },
  typeormConnection: Connection,
): Promise<RunContext>  {
  let context: RunContext = createEmptyContext()

  let eventI = await typeormConnection.getRepository(StartEventInstance).findOneOrFail(eventInstance.id, {
    relations: ['template', 'template.outputs'],
  })
  if (eventI && eventI.template) {
    let outputsDataTemplates: DataObjectTemplate[] = []
    let outputsDataInstances: DataObjectInstance[] = []

    if (eventI.template.outputs) {
      outputsDataTemplates = eventI.template.outputs
      outputsDataInstances = await loadFilteredDataInstances({
        typeormConnection,
        processInstanceId: eventI.processInstanceId as number,
        dataTemplates: outputsDataTemplates,
      })
    }
    context = createContextForStartEvent({
      eventTemplate: eventI.template,
      eventInstance: eventI,
      outputsDataTemplates,
      outputsDataInstances,
    })
  }
  return context
}

export async function loadContextForEndEvent(
  eventInstance: { id: number },
  typeormConnection: Connection,
): Promise<RunContext>  {
  let context: RunContext = createEmptyContext()

  let eventI = await typeormConnection.getRepository(EndEventInstance).findOneOrFail(eventInstance.id, {
    relations: ['template', 'template.inputs'],
  })
  if (eventI && eventI.template) {
    let inputsDataTemplates: DataObjectTemplate[] = []
    let inputsDataInstances: DataObjectInstance[] = []

    if (eventI.template.inputs) {
      inputsDataTemplates = eventI.template.inputs
      inputsDataInstances = await loadFilteredDataInstances({
        typeormConnection,
        processInstanceId: eventI.processInstanceId as number,
        dataTemplates: inputsDataTemplates,
      })
    }
    context = createContextForEndEvent({
      eventTemplate: eventI.template,
      eventInstance: eventI,
      inputsDataTemplates: inputsDataTemplates,
      inputsDataInstances: inputsDataInstances,
    })
  }
  return context
}


//#endregion
