import { Connection, FindConditions, Like } from 'typeorm'

import { Group } from '../../entity'
import { DataObjectTemplate, NodeElementTemplate, ProcessInstance } from '../../entity/bpmn'
import { ContextUser } from '../../graphql/context'

// instances
// dataObjects
// nodeElements

export async function getInstances(options: {
  connection: Connection,
  client?: ContextUser,
  filter: {
    processTemplateId: number,
    status?: string,
  },
}): Promise<ProcessInstance[]> {
  let { client, connection, filter } = options

  let findConditions: FindConditions<ProcessInstance> = {}
  findConditions.processTemplateId = filter.processTemplateId
  if (filter.status) {
    // @ts-ignore
    findConditions.status = Like(`${filter.status}`)
  }

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
  filter: {
    processTemplateId: number,
    implementationContains?: string,
  },
}): Promise<NodeElementTemplate[]> {
  let { client, connection, filter } = options

  let findConditions: FindConditions<NodeElementTemplate> = {}
  findConditions.processTemplateId = filter.processTemplateId

  if (filter.implementationContains) {
    findConditions.implementation = Like(`%${filter.implementationContains}%`)
  }

  let node = await connection.manager.find(NodeElementTemplate, {
    where: findConditions,
  })
  return node
}

export async function getCandidateGroup(options: {
  connection: Connection,
  client?: ContextUser,
  filter: { groupName: string },
}): Promise<Group | null> {
  let { client, connection, filter } = options

  let findConditions: FindConditions<Group> = {}
  findConditions.name = filter.groupName

  let group = await connection.manager.findOne(Group, {
    where: findConditions,
  })
  return group || null
}
