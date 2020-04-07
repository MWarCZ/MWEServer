import { Connection, FindConditions } from 'typeorm'

import { Group } from '../../entity'
import { NodeElementInstance, ProcessTemplate } from '../../entity/bpmn'
import { ContextUser } from '../../graphql/context'


export async function getInstances(options: {
  connection: Connection,
  client?: ContextUser,
  filter: { nodeTemplateId: number },
}): Promise<NodeElementInstance[]> {
  let { client, connection, filter } = options

  let findConditions: FindConditions<NodeElementInstance> = {}
  findConditions.templateId = filter.nodeTemplateId

  let instances = await connection.manager.find(NodeElementInstance, {
    where: findConditions,
  })
  return instances
}

export async function getProcessTemplate(options: {
  connection: Connection,
  client?: ContextUser,
  filter: { processTemplateId: number },
}): Promise<ProcessTemplate|null> {
  let { client, connection, filter } = options

  let findConditions: FindConditions<ProcessTemplate> = {}
  findConditions.id = filter.processTemplateId

  let processT = await connection.manager.findOne(ProcessTemplate, {
    where: findConditions,
  })
  return processT || null
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
