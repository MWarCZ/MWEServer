import { Connection, Equal, In } from 'typeorm'

import {
  ActivityStatus,
  DataObjectInstance,
  DataObjectTemplate,
  EventInstance,
  StartEventInstance,
  StartEventTemplate,
  TaskInstance,
  TaskTemplate,
} from '../entity/bpmn'

////////////////////////////
// createXXX - synchroni funkce, ktere nepracuji primo s databazi.
// loadXXX - asynchroni funkce, ktere pracuji primo s databozi.
//

//#region Typy

export type RunContextMap = {
  [key: string]: any
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
  startDate: Date,
  endData: Date,
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

export function createContextForTask(
  options: {
    taskTemplate: TaskTemplate,
    taskInstance: TaskInstance,
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

  context.$SELF = {
    // Z instance
    startDate: undefined,
    endData: undefined,
    status: taskInstance.status,
    // Ze sablony
    bpmnId: taskTemplate.bpmnId,
    name: taskTemplate.name,
    implementation: taskTemplate.implementation,
  }

  let inputsData = createContextInputs({
    inputsDataInstances,
    inputsDataTemplates
  })
  context.$INPUT = { ...context.$INPUT, ...inputsData}

  let outputsData = createContextOutputs({
    outputsDataInstances,
    outputsDataTemplates
  })
  context.$OUTPUT = { ...context.$OUTPUT, ...outputsData}

  return context
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

  context.$SELF = {
    // Z instance
    startDate: undefined,
    endData: undefined,
    status: eventInstance.status,
    // Ze sablony
    bpmnId: eventTemplate.bpmnId,
    name: eventTemplate.name,
  }

  let outputsData = createContextOutputs({
    outputsDataInstances,
    outputsDataTemplates
  })
  context.$OUTPUT = { ...context.$OUTPUT, ...outputsData }

  return context
}

//#endregion

//#region Funkce LoacXXX

export async function loadContextForTask(
  taskInstance: { id: number },
  typeormConnection: Connection,
) {
  // [x] Ziskat instanci ulohy.
  // [x] Ziskat sablonu ulohy.
  // [x] Ziskat datove vstupy dane sablony ulohy.
  // [x] Ziskat existujici instance datovych vstupu.
  //    [x] Stejna instance procesu pro instanci ulohy a instance datoveho objektu.
  //    [x] Instance datoveho objektu je vytvorena dle sablon datovych vstupu sablony ulohy.
  //
  let context: RunContext = createEmptyContext()

  let taskI = await typeormConnection.getRepository(TaskInstance).findOneOrFail(taskInstance.id, {
    relations: ['template', 'template.inputs', 'template.outputs'],
  })
  // console.log(JSON.stringify(taskI, null, 2))

  if (taskI && taskI.template) {
    let inputsDataTemplates: DataObjectTemplate[] = []
    let inputsDataInstances: DataObjectInstance[] = []
    let outputsDataTemplates: DataObjectTemplate[] = []
    let outputsDataInstances: DataObjectInstance[] = []

    if (taskI.template.inputs) {
    // DataObjectTemplate pro ulohu
      inputsDataTemplates = taskI.template.inputs
    // jejich id => DataObjectTemplate.id
      let inputsDataTemplatesIds = inputsDataTemplates.map(d => d.id)
      // DataObjectInstance patrici do instance procesu a zaroven do mnoziny vstupu ulohy
      inputsDataInstances = await typeormConnection.getRepository(DataObjectInstance).find({
        processInstanceId: Equal(taskI.processInstanceId),
        templateId: In([...inputsDataTemplatesIds]),
      })
    }
    if (taskI.template.outputs) {
      // DataObjectTemplate pro ulohu
      outputsDataTemplates = taskI.template.outputs
      // jejich id => DataObjectTemplate.id
      let outputsDataTemplatesIds = outputsDataTemplates.map(d => d.id)
      // DataObjectInstance patrici do instance procesu a zaroven do mnoziny vstupu ulohy
      outputsDataInstances = await typeormConnection.getRepository(DataObjectInstance).find({
        processInstanceId: Equal(taskI.processInstanceId),
        templateId: In([...outputsDataTemplatesIds]),
      })
    }

    context = createContextForTask({
      context,
      taskTemplate: taskI.template,
      taskInstance: taskI,
      inputsDataTemplates,
      inputsDataInstances,
      outputsDataTemplates,
      outputsDataInstances,
    })
  }

  if (taskI && taskI.template && taskI.template.inputs) {
    // DataObjectTemplate pro ulohu
    let taskInputsTemplates = taskI.template.inputs
    // jejich id => DataObjectTemplate.id
    let taskInputsTemplatesIds = taskInputsTemplates.map(d => d.id)
    // DataObjectInstance patrici do instance procesu a zaroven do mnoziny vstupu ulohy
    let taskInputsInstances = await typeormConnection.getRepository(DataObjectInstance).find({
      processInstanceId: Equal(taskI.processInstanceId),
      templateId: In([...taskInputsTemplatesIds]),
    })

    // console.log('DOI:\n', JSON.stringify(taskInputsInstances, null, 2))

    context = createContextForTask({
      context,
      taskTemplate: taskI.template,
      taskInstance: taskI,
      inputsDataTemplates: taskInputsTemplates,
      inputsDataInstances: taskInputsInstances,
      outputsDataTemplates: [],
      outputsDataInstances: [],
    })

  }

  // console.log(JSON.stringify(context, null, 2))
  return context
}

export async function loadContextForStartEvent(
  eventInstance: { id: number },
  typeormConnection: Connection,
) {
  let context: RunContext = createEmptyContext()

  let eventI = await typeormConnection.getRepository(EventInstance).findOneOrFail(eventInstance.id, {
    relations: ['template'],
  })
  if (eventI && eventI.template) {
    context = createContextForStartEvent({
      eventTemplate: eventI.template,
      eventInstance: eventI,
      outputsDataTemplates: [],
      outputsDataInstances: [],
    })
  }
  return context
}

//#endregion
