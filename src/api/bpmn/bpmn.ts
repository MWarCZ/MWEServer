import { Connection, FindConditions, Like } from 'typeorm'
import { JsonMap } from 'types/json'

import { BpmnBuilder } from '../../bpmnBuilder'
import { BpmnRunner, NodeImplementationFlatItemsMap } from '../../bpmnRunner'
import { NodeElementInstance, NodeElementTemplate, ProcessInstance, ProcessStatus, ProcessTemplate } from '../../entity/bpmn'
import { ContextUser } from '../../graphql/context'
import { getClientGroupNames, PossibleFilter, ProtectedGroups } from '../helpers'
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
  if (!client) { throw new UnloggedUserError() }
  const groupNames = getClientGroupNames(client)

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
  filter?: {
    isExecutable?: boolean,
    version?: string,
    bpmnId?: string,
    id?: number,
  },
}) {
  const {connection, client, filter} = options
  if (!client) { throw new UnloggedUserError() }
  const groupNames = getClientGroupNames(client)

  let findConditions: FindConditions<ProcessTemplate> = {}
  if (filter) {
    if (typeof filter.isExecutable === 'boolean') {
      findConditions.isExecutable = filter.isExecutable
    }
    if (filter.id) {
      findConditions.id = findConditions.id
    }
    if (filter.bpmnId) {
      findConditions.bpmnId = findConditions.bpmnId
    }
    if (filter.version) {
      findConditions.version = findConditions.version
    }
  }

  let process = await connection.manager.find(ProcessTemplate, findConditions)
  return process
}

export async function getProcessInstance(options: {
  connection: Connection,
  client?: ContextUser,
  filter: FilterProcessInstanceBy,
}) {
  const { connection, client, filter } = options
  if (!client) { throw new UnloggedUserError() }
  const groupNames = getClientGroupNames(client)

  let findConditions: FindConditions<ProcessInstance> = {}
  findConditions = getProcessInstanceFindConditions({ filter })
  let process = await connection.manager.findOne(ProcessInstance, findConditions)
  return process
}
export async function getProcessInstances(options: {
  connection: Connection,
  client?: ContextUser,
  filter?: {
    status?: string,
  },
}) {
  const { connection, client, filter } = options
  if (!client) { throw new UnloggedUserError() }
  const groupNames = getClientGroupNames(client)

  let findConditions: FindConditions<ProcessInstance> = {}
  if (filter) {
    if (filter.status) {
      // @ts-ignore
      findConditions.status = Like(`${filter.status}`)
    }
  }

  let process = await connection.manager.find(ProcessInstance, findConditions)
  return process
}


export async function getNodeInstance(options: {
  connection: Connection,
  client?: ContextUser,
  filter?: {
    id?: number | null,
  } | null,
}) {
  const { connection, client, filter } = options
  if (!client) { throw new UnloggedUserError() }
  const groupNames = getClientGroupNames(client)

  let findConditions: FindConditions<NodeElementInstance> = {}
  if (filter && filter.id) {
    findConditions.id = filter.id
  } else {
    return undefined
  }
  let node = await connection.manager.findOne(NodeElementInstance, findConditions)
  return node
}
export async function getNodeInstances(options: {
  connection: Connection,
  client?: ContextUser,
  filter?: {
    status?: string | null,
  } | null,
}) {
  const { connection, client, filter } = options
  if (!client) { throw new UnloggedUserError() }
  const groupNames = getClientGroupNames(client)

  let findConditions: FindConditions<NodeElementInstance> = {}
  if (filter) {
    if (filter.status) {
      // @ts-ignore
      findConditions.status = Like(`${filter.status}`)
    }
  }

  let nodes = await connection.manager.find(NodeElementInstance, findConditions)
  return nodes
}

export async function getNodeAdditionsFormat(options: {
  connection: Connection,
  client?: ContextUser,
  node: { id: number },
  runner: BpmnRunner,
}): Promise<NodeImplementationFlatItemsMap> {
  const {runner, node, client} = options
  if (!client) { throw new UnloggedUserError() }
  const groupNames = getClientGroupNames(client)

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
  if (!client) { throw new UnloggedUserError() }
  const groupNames = getClientGroupNames(client)

  // Overeni prav
  if (!groupNames.includes(ProtectedGroups.TopManager)) {
    throw new PermissionError()
  }

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
  if (!client) { throw new UnloggedUserError() }
  const groupNames = getClientGroupNames(client)

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
  const { runner, node, additions, client } = options
  if (!client) { throw new UnloggedUserError() }
  const groupNames = getClientGroupNames(client)

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
  const { runner, processInstance, client } = options
  if (!client) { throw new UnloggedUserError() }
  const groupNames = getClientGroupNames(client)

  let result = await runner.runProcessWidhrawn({
    processInstance,
    status: {
      process: ProcessStatus.Withdrawn,
    },
    fn: (...args) => runner.processWithdrawn(...args),
  })
  return result
}


// NodeInstance
// NodeInstances

// claimNodeInstance
// releaseNodeInstance

export async function claimNodeInstance(options: {
  connection: Connection,
  client?: ContextUser,
  nodeInstance: { id: number },
}) {
  const { connection, client, nodeInstance } = options

  if (!client) { throw new UnloggedUserError() }
  const groupNames = getClientGroupNames(client)

  // Ziskani uzlu pro zabrani
  let node = await connection.manager.findOne(NodeElementInstance, {
    relations: ['template'],
    where: { id: nodeInstance.id },
  })
  if (!node) {
    throw new Error(`Uzel s id '${nodeInstance.id}' nebyl nalezen.`)
  }
  // Kontrola zda uzivatel patri mezi kandid8ty na zabrani.
  const candidate = (node.template) ? node.template.candidateAssignee : ''
  if (!groupNames.includes(candidate)) {
    throw new PermissionError()
  }
  if (node.assignee) {
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
  nodeInstance: { id: number },
}) {
  const { connection, client, nodeInstance } = options

  if (!client) { throw new UnloggedUserError() }
  const groupNames = getClientGroupNames(client)

  // Ziskani uzlu pro zabrani
  let node = await connection.manager.findOne(NodeElementInstance, {
    relations: ['template'],
    where: { id: nodeInstance.id },
  })
  if (!node) {
    throw new Error(`Uzel s id '${nodeInstance.id}' nebyl nalezen.`)
  }
  if (!node.assignee) {
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

export async function deleteProcessTemplate(options: {
  connection: Connection,
  client?: ContextUser,
  processTemplate: { id: number },
}) {
  const { connection, client, processTemplate } = options

  if (!client) { throw new UnloggedUserError() }
  const groupNames = getClientGroupNames(client)


  // nalezeni uzlu
  let process = await connection.manager.findOne(ProcessTemplate, {
    where: { id: processTemplate.id },
  })
  if (!process) {
    throw new Error(`Process s id '${processTemplate.id}' nebyl nalezen.`)
  }
  // Overeni prav
  if (!groupNames.includes(ProtectedGroups.TopManager)) {
    throw new PermissionError()
  }
  await connection.manager.remove(process)

  process.id = processTemplate.id
  return process
}
export async function deleteProcessInstance(options: {
  connection: Connection,
  client?: ContextUser,
  processInstance: { id: number },
}) {
  const { connection, client, processInstance } = options

  if (!client) { throw new UnloggedUserError() }
  const groupNames = getClientGroupNames(client)


  // nalezeni uzlu
  let process = await connection.manager.findOne(ProcessInstance, {
    where: { id: processInstance.id },
  })
  if (!process) {
    throw new Error(`Process s id '${processInstance.id}' nebyl nalezen.`)
  }
  // Overeni prav
  if (!groupNames.includes(ProtectedGroups.TopManager)) {
    throw new PermissionError()
  }
  await connection.manager.remove(process)

  process.id = processInstance.id
  return process
}


export async function updateProcessTemplate(options: {
  connection: Connection,
  client?: ContextUser,
  processTemplate: { id: number },
  data: {
    isExecutable?: boolean,
    name?: string,
    candidateManager?: string,
  },
}) {
  const { connection, client, processTemplate, data } = options

  if (!client) { throw new UnloggedUserError() }
  const groupNames = getClientGroupNames(client)


  // Overeni prav
  if (!groupNames.includes(ProtectedGroups.TopManager)) {
    throw new PermissionError()
  }

  let process = await connection.manager.findOne(ProcessTemplate, {
    where: { id: processTemplate.id },
  })
  if (!process) {
    throw new Error(`Process s id '${processTemplate.id}' nebyl nalezen.`)
  }

  if(typeof data.candidateManager === 'string') {
    process.candidateManager = data.candidateManager
  }
  if (typeof data.isExecutable === 'boolean') {
    process.isExecutable = data.isExecutable
  }
  if (typeof data.name === 'string') {
    process.name = data.name
  }
  process = await connection.manager.save(process)
  return process
}

export async function updateNodeTemplate(options: {
  connection: Connection,
  client?: ContextUser,
  nodeTemplate: { id: number },
  data: {
    name?: string,
    candidateAssignee?: string,
  },
}) {
  const { connection, client, nodeTemplate, data } = options

  if (!client) { throw new UnloggedUserError() }
  const groupNames = getClientGroupNames(client)

  // Overeni prav
  if (!groupNames.includes(ProtectedGroups.TopManager)) {
    throw new PermissionError()
  }

  let node = await connection.manager.findOne(NodeElementTemplate, {
    where: { id: nodeTemplate.id },
  })
  if (!node) {
    throw new Error(`Uzel s id '${nodeTemplate.id}' nebyl nalezen.`)
  }

  if (typeof data.candidateAssignee === 'string') {
    node.candidateAssignee = data.candidateAssignee
  }
  if (typeof data.name === 'string') {
    node.name = data.name
  }
  node = await connection.manager.save(node)

  return node
}

