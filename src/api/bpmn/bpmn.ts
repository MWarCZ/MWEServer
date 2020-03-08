import { Connection, FindConditions } from 'typeorm'

import { BpmnBuilder } from '../../bpmnBuilder'
import { BpmnRunner } from '../../bpmnRunner'
import { ProcessInstance, ProcessTemplate } from '../../entity/bpmn'
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
  let process = await connection.manager.findOne(ProcessTemplate, findConditions)
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

// NodeInstance
// NodeInstances
// NodeAdditions

// claimNodeInstance
// releaseNodeInstance
