import { Connection, Equal, In } from 'typeorm'

import { DataObjectInstance, DataObjectTemplate, TaskInstance } from '../entity/bpmn'



type RunContextInput = {
  [dataObjectName: string]: any,
}

export type RunContext = {
  $GLOBAL: any,
  $INPUT: RunContextInput,
}

export function createContextInputs(
  options: {
    taskInputsTemplates: DataObjectTemplate[],
    taskInputsInstances: DataObjectInstance[],
  },
): RunContextInput {
  const {
    taskInputsTemplates,
    taskInputsInstances,
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



export async function createContext(
  taskInstance: { id: number },
  typeormConnection: Connection,
) {
  let context: RunContext = {
    $GLOBAL: {},
    $INPUT: {},
  }
  // [x] Ziskat instanci ulohy.
  // [x] Ziskat sablonu ulohy.
  // [x] Ziskat datove vstupy dane sablony ulohy.
  // [x] Ziskat existujici instance datovych vstupu.
  //    [x] Stejna instance procesu pro instanci ulohy a instance datoveho objektu.
  //    [x] Instance datoveho objektu je vytvorena dle sablon datovych vstupu sablony ulohy.

  let taskI = await typeormConnection.getRepository(TaskInstance).findOneOrFail({
    relations: ['template', 'template.inputs'],
  })
  console.log(JSON.stringify(taskI, null, 2))

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

    console.log('DOI:\n', JSON.stringify(taskInputsInstances, null, 2))

    let data = createContextInputs({
      taskInputsInstances,
      taskInputsTemplates
    })
    context.$INPUT = data

    console.log('DATA:\n', JSON.stringify(data, null, 2))
  }

  // console.log(JSON.stringify(context, null, 2))
  return context
}
