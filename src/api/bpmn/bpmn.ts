import { Connection, FindConditions } from 'typeorm'
import { JsonMap } from 'types/json'

import { BpmnBuilder } from '../../bpmnBuilder'
import { BpmnRunner, NodeImplementationFlatItemsMap } from '../../bpmnRunner'
import { ProcessInstance, ProcessStatus, ProcessTemplate } from '../../entity/bpmn'
import { ContextUser } from '../../graphql/context'
import { PossibleFilter } from '../helpers'


export type FilterProcessTemplateById = { id: number }
export type FilterProcessTemplateByVersion = { version: string, bpmnId: string }
export type FilterProcessTemplateBy = FilterProcessTemplateById | FilterProcessTemplateByVersion

export type FilterProcessInstanceById = { id: number }
export type FilterProcessInstanceBy = FilterProcessInstanceById


export function getProcessTemplateFindConditions(options: {
  filter: FilterProcessTemplateBy,
  findConditions?: FindConditions<ProcessTemplate>,
}) {
  let findConditions: FindConditions<ProcessTemplate> = options.findConditions || {}
  let filter = options.filter as PossibleFilter<FilterProcessTemplateById, FilterProcessTemplateByVersion>

  if (filter.id) {
    findConditions.id = filter.id
  } else if (filter.version && filter.bpmnId) {
    findConditions.version = filter.version
    findConditions.bpmnId = filter.bpmnId
  } else {
    throw new Error('Sablona procesu nelze indentifikovat.')
  }
  return findConditions
}

export function getProcessInstanceFindConditions(options: {
  filter: FilterProcessInstanceBy,
  findConditions?: FindConditions<ProcessInstance>,
}) {
  let findConditions: FindConditions<ProcessInstance> = options.findConditions || {}
  let filter = options.filter

  if (filter.id) {
    findConditions.id = filter.id
  } else {
    throw new Error('Instance procesu nelze indentifikovat.')
  }
  return findConditions
}

// ==========================

export async function getProcessTemplate(options: {
  connection: Connection,
  client?: ContextUser,
  filter: FilterProcessTemplateBy,
}) {
  const { connection, client, filter } = options
  let findConditions: FindConditions<ProcessTemplate> = {}
  findConditions = getProcessTemplateFindConditions({filter})
  let process = await connection.manager.findOne(ProcessTemplate, {
    relations: [],
    where: findConditions,
  })
  return process
}
export async function getProcessTemplates(options: {
  connection: Connection,
  client?: ContextUser,
}) {
  const {connection, client} = options
  let findConditions: FindConditions<ProcessTemplate> = {}
  let process = await connection.manager.find(ProcessTemplate, findConditions)
  return process
}

export async function getProcessInstance(options: {
  connection: Connection,
  client?: ContextUser,
  filter: FilterProcessInstanceBy,
}) {
  const { connection, client, filter } = options
  let findConditions: FindConditions<ProcessInstance> = {}
  findConditions = getProcessInstanceFindConditions({ filter })
  let process = await connection.manager.findOne(ProcessInstance, findConditions)
  return process
}
export async function getProcessInstances(options: {
  connection: Connection,
  client?: ContextUser,
}) {
  const { connection, client } = options
  let findConditions: FindConditions<ProcessInstance> = {}
  let process = await connection.manager.find(ProcessInstance, findConditions)
  return process
}

export async function getNodeAdditionsFormat(options: {
  connection: Connection,
  client?: ContextUser,
  node: { id: number },
  runner: BpmnRunner,
}): Promise<NodeImplementationFlatItemsMap> {
  const {runner, node} = options
  let result = await runner.runNodeAdditionsFormat({
    instance: node,
  })
  return result
}
// nodeAdditions(idNI: Int!, json: String!)

export async function uploadProcess(options: {
  connection: Connection,
  client?: ContextUser,
  xml: string,
}) {
  const { connection, client, xml } = options
  const builder = new BpmnBuilder(connection)
  let process = await builder.loadFromXml(xml)
  return process
}

export async function initProcess(options: {
  connection: Connection,
  client?: ContextUser,
  data: {
    processId: number,
    firstNodeId: number,
  },
}) {
  const { connection, client, data } = options
  const runner = new BpmnRunner(connection)

  let process = await runner.initAndSaveProcess({ id: data.processId }, { id: data.firstNodeId })
  return process
}

export async function setNodeAdditions(options: {
  connection: Connection,
  client?: ContextUser,
  node: { id: number },
  runner: BpmnRunner,
  additions: JsonMap,
}) {
  const { runner, node, additions } = options
  let result = await runner.runNodeAdditions({
    instance: node,
    additions,
  })
  return result
}

export async function withdrawnProcess(options: {
  connection: Connection,
  client?: ContextUser,
  runner: BpmnRunner,
}) {
  const { runner } = options
  let result = await runner.runProcessWidhrawn({
    processInstance: { id:1 },
    status: {
      process: ProcessStatus.Withdrawn,
    },
    fn: runner.processWithdrawn,
  })
  return result
}


// NodeInstance
// NodeInstances
// NodeAdditions

// claimNodeInstance
// releaseNodeInstance
