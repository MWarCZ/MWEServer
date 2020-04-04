import { Connection, FindConditions } from 'typeorm'

import { User } from '../../entity'
import { NodeElementTemplate, ProcessInstance } from '../../entity/bpmn'
import { ContextUser } from '../../graphql/context'


export async function getTemplate(options: {
  connection: Connection,
  client?: ContextUser,
  filter: { nodeTemplateId: number },
}): Promise<NodeElementTemplate | null> {
  let { client, connection, filter } = options

  let findConditions: FindConditions<NodeElementTemplate> = {}
  findConditions.id = filter.nodeTemplateId

  let template = await connection.manager.findOne(NodeElementTemplate, {
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

export async function getAssignee(options: {
  connection: Connection,
  client?: ContextUser,
  filter: { userId: number },
}): Promise<User | null> {
  let { client, connection, filter } = options

  let findConditions: FindConditions<User> = {}
  findConditions.id = filter.userId

  let user = await connection.manager.findOne(User, {
    where: findConditions,
  })
  return user || null
}
