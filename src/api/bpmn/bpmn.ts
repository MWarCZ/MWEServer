import { Connection, FindConditions } from 'typeorm'
import { JsonMap } from 'types/json'

import { BpmnBuilder } from '../../bpmnBuilder'
import { BpmnRunner, NodeImplementationFlatItemsMap } from '../../bpmnRunner'
import { NodeElementInstance, ProcessInstance, ProcessStatus, ProcessTemplate } from '../../entity/bpmn'
import { ContextUser } from '../../graphql/context'
import { PossibleFilter } from '../helpers'
import { PermissionError, UnloggedUserError } from '../permissionError'

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
  processInstance: { id: number },
}) {
  const { runner, processInstance } = options
  let result = await runner.runProcessWidhrawn({
    processInstance,
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

export async function claimNodeInstance(options: {
  connection: Connection,
  client?: ContextUser,
  nodeInstance: { id: number }
}) {
  const { connection, client, nodeInstance } = options

  if (!client) { throw new UnloggedUserError() }
  const groupNames = client.membership.map(g => g.group.name) as string[]

  // Ziskani uzlu pro zabrani
  let node = await connection.manager.findOne(NodeElementInstance, {
    relations: ['template'],
    where: { id: nodeInstance.id },
  })
  if(!node) {
    throw new Error(`Uzel s id '${nodeInstance.id}' nebyl nalezen.`)
  }
  // Kontrola zda uzivatel patri mezi kandid8ty na zabrani.
  const candidate = (node.template)? node.template.candidateAssignee : ''
  if(!groupNames.includes(candidate)) {
    throw new PermissionError()
  }
  if(node.assignee) {
    throw new Error('Uzel je jiz zabran jinym uzivatelem.')
  }
  // Prirazeni klienta k uzlu.
  node.assignee = client
  node = await connection.manager.save(node)

  return node
}

export async function releaseNodeInstance(options: {
  connection: Connection,
  client?: ContextUser,
  nodeInstance: { id: number }
}) {
  const { connection, client, nodeInstance } = options

  if (!client) { throw new UnloggedUserError() }
  const groupNames = client.membership.map(g => g.group.name) as string[]

  // Ziskani uzlu pro zabrani
  let node = await connection.manager.findOne(NodeElementInstance, {
    relations: ['template'],
    where: { id: nodeInstance.id },
  })
  if (!node) {
    throw new Error(`Uzel s id '${nodeInstance.id}' nebyl nalezen.`)
  }
  if (!node.assignee){
    throw new Error(`Neni mozne uvolnit, protoze uzel s id '${node.id}' neni obsazen.`)
  }

  // Kontrola zda client muze provezt uvolneni
  if ((node.assignee.id !== client.id)) {
    throw new PermissionError()
  }

  node.assignee = null
  node = await connection.manager.save(node)

  return node
}
