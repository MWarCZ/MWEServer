import { Connection, FindConditions } from 'typeorm'

import { DataObjectTemplate, ProcessInstance } from '../../entity/bpmn'
import { ContextUser } from '../../graphql/context'


export async function getTemplate(options: {
  connection: Connection,
  client?: ContextUser,
  filter: { dataTemplateId: number },
}): Promise<DataObjectTemplate | null> {
  let { client, connection, filter } = options

  let findConditions: FindConditions<DataObjectTemplate> = {}
  findConditions.id = filter.dataTemplateId

  let template = await connection.manager.findOne(DataObjectTemplate, {
    where: findConditions,
  })
  return template || null
}

export async function getProcessInstance(options: {
  connection: Connection,
  client?: ContextUser,
  filter: { processInstanceId: number },
}): Promise<ProcessInstance | null> {
  let { client, connection, filter } = options

  let findConditions: FindConditions<ProcessInstance> = {}
  findConditions.id = filter.processInstanceId

  let processI = await connection.manager.findOne(ProcessInstance, {
    where: findConditions,
  })
  return processI || null
}
