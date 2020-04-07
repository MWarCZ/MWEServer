import { Connection, FindConditions } from 'typeorm'

import { DataObjectInstance } from '../../entity/bpmn'
import { ContextUser } from '../../graphql/context'


export async function getInstances(options: {
  connection: Connection,
  client?: ContextUser,
  filter: { dataTemplateId: number },
}): Promise<DataObjectInstance[]> {
  let { client, connection, filter } = options

  let findConditions: FindConditions<DataObjectInstance> = {}
  findConditions.templateId = filter.dataTemplateId

  let instances = await connection.manager.find(DataObjectInstance, {
    where: findConditions,
  })
  return instances
}
