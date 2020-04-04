import { Connection, FindConditions } from 'typeorm'

import { DataObjectInstance, NodeElementInstance, ProcessTemplate } from '../../entity/bpmn'
import { ContextUser } from '../../graphql/context'

// template
// dataObjects
// nodeElements

export async function getTemplate(options: {
  connection: Connection,
  client?: ContextUser,
  filter: { idProcessTemplate: number },
}): Promise<ProcessTemplate|null> {
  let { client, connection, filter } = options

  let findConditions: FindConditions<ProcessTemplate> = {}
  findConditions.id = filter.idProcessTemplate

  let template = await connection.manager.findOne(ProcessTemplate, {
    where: findConditions,
  })
  return template || null
}

export async function getDataObjects(options: {
  connection: Connection,
  client?: ContextUser,
  filter: { processInstanceId: number },
}): Promise<DataObjectInstance[]> {
  let { client, connection, filter } = options

  let findConditions: FindConditions<DataObjectInstance> = {}
  findConditions.processInstanceId = filter.processInstanceId

  let dataObjs = await connection.manager.find(DataObjectInstance, {
    where: findConditions,
  })
  return dataObjs
}

export async function getNodeElements(options: {
  connection: Connection,
  client?: ContextUser,
  filter: { idProcessInstance: number },
}): Promise<NodeElementInstance[]> {
  let { client, connection, filter } = options

  let findConditions: FindConditions<NodeElementInstance> = {}
  findConditions.processInstanceId = filter.idProcessInstance

  let nodes = await connection.manager.find(NodeElementInstance, {
    where: findConditions,
  })
  return nodes
}
