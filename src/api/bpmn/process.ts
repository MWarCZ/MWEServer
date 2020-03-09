import { Connection, FindConditions } from 'typeorm'

import { DataObjectTemplate, NodeElementTemplate, ProcessInstance } from '../../entity/bpmn'
import { ContextUser } from '../../graphql/context'

// instances
// dataObjects
// nodeElements

export async function getInstances(options: {
  connection: Connection,
  client?: ContextUser,
  filter: { processTemplateId: number },
}): Promise<ProcessInstance[]> {
  let { client, connection, filter } = options

  let findConditions: FindConditions<ProcessInstance> = {}
  findConditions.processTemplateId = filter.processTemplateId

  let instances = await connection.manager.find(ProcessInstance, {
    where: findConditions,
  })
  return instances
}

export async function getDataObjects(options: {
  connection: Connection,
  client?: ContextUser,
  filter: { processTemplateId: number },
}): Promise<DataObjectTemplate[]> {
  let { client, connection, filter } = options

  let findConditions: FindConditions<DataObjectTemplate> = {}
  findConditions.processTemplateId = filter.processTemplateId

  let dataObj = await connection.manager.find(DataObjectTemplate, {
    where: findConditions,
  })
  return dataObj
}

export async function getNodeElements(options: {
  connection: Connection,
  client?: ContextUser,
  filter: { processTemplateId: number },
}): Promise<NodeElementTemplate[]> {
  let { client, connection, filter } = options

  let findConditions: FindConditions<NodeElementTemplate> = {}
  findConditions.processTemplateId = filter.processTemplateId

  let node = await connection.manager.find(NodeElementTemplate, {
    where: findConditions,
  })
  return node
}
