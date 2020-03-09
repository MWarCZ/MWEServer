import { Connection, FindConditions } from 'typeorm'

import { DataObjectInstance, NodeElementTemplate, ProcessTemplate } from '../../entity/bpmn'
import { ContextUser } from '../../graphql/context'

// template
// dataObjects
// nodeElements

export async function getTemplate(options: {
  connection: Connection,
  client?: ContextUser,
  filter: { id: number },
}): Promise<ProcessTemplate[]> {
  let { client, connection, filter } = options

  let findConditions: FindConditions<ProcessTemplate> = {}
  findConditions.id = filter.id

  let instances = await connection.manager.find(ProcessTemplate, {
    where: findConditions,
  })
  return instances
}

export async function getDataObjects(options: {
  connection: Connection,
  client?: ContextUser,
  filter: { processInstanceId: number },
}): Promise<DataObjectInstance[]> {
  let { client, connection, filter } = options

  let findConditions: FindConditions<DataObjectInstance> = {}
  findConditions.processInstanceId = filter.processInstanceId

  let dataObj = await connection.manager.find(DataObjectInstance, {
    where: findConditions,
  })
  return dataObj
}

export async function getNodeElements(options: {
  connection: Connection,
  client?: ContextUser,
  filter: { id: number },
}): Promise<NodeElementTemplate[]> {
  let { client, connection, filter } = options

  let findConditions: FindConditions<NodeElementTemplate> = {}
  findConditions.processTemplateId = filter.id

  let node = await connection.manager.find(NodeElementTemplate, {
    where: findConditions,
  })
  return node
}
