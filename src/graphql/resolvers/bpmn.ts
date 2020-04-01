import * as ApiBpmn from '../../api/bpmn'
import * as ApiProcessT from '../../api/bpmn/process'
import * as Bpmn from '../../entity/bpmn'
import { JsonMap } from '../../types/json'
import { GQLTypes } from '../generated/types'


export const Query: GQLTypes.QueryResolvers = {
  processTemplate: async(_, {filter}, { client, db: connection }) => {
    let process = await ApiBpmn.getProcessTemplate({
      connection,
      client,
      filter: filter as ApiBpmn.FilterProcessTemplateBy,
    })
    // @ts-ignore
    return process as GQLTypes.ProcessTemplate
  },
  processTemplates: async(_, args, { client, db: connection }) => {
    let process = await ApiBpmn.getProcessTemplates({
      connection,
      client,
    })
    // @ts-ignore
    return process as GQLTypes.ProcessTemplate[]
  },
  processInstance: async(_, { filter }, { client, db: connection }) => {
    let process = await ApiBpmn.getProcessInstance({
      connection,
      client,
      filter: filter as ApiBpmn.FilterProcessInstanceBy,
    })
    // @ts-ignore
    return process as GQLTypes.ProcessInstance
  },
  processInstances: async(_, args, { client, db: connection }) => {
    let process = await ApiBpmn.getProcessInstances({
      connection,
      client,
    })
    // @ts-ignore
    return process as GQLTypes.ProcessInstance[]
  },
  nodeAdditionsFormat: async(_, args, { client, db: connection, runner, worker }) => {
    if (runner) {
      const result = await ApiBpmn.getNodeAdditionsFormat({
        connection,
        runner,
        client,
        node: {id: args.idNI },
      })
      // @ts-ignore
      return result as GQLTypes.NodeAdditions[]
    }
    return [] as GQLTypes.NodeAdditions[]
  },
}

export const Mutation: GQLTypes.MutationResolvers = {
  uploadProcess: async(_, { xml }, { client, db: connection }) => {
    let process = await ApiBpmn.uploadProcess({
      connection,
      client,
      xml: xml as string,
    })
    // @ts-ignore
    return process as GQLTypes.ProcessTemplate[]
  },
  initProcess: async(_, { input }, { client, db: connection, worker }) => {
    let result = await ApiBpmn.initProcess({
      connection,
      client,
      data: {
        processId: input.idProcess,
        firstNodeId: input.idFirstNode,
      },
    })
    if (worker) {
      worker.postChangedProcess(result.process)
      worker.postChangedNodes([result.node])
    }
    // @ts-ignore
    return result.process as GQLTypes.ProcessInstance
  },
  nodeAdditions: async(_, args, { client, db: connection, runner, worker }) => {
    if (runner) {
      // TODO Osetrit parsovani a mapu.
      const additions: JsonMap = JSON.parse(args.json)
      const result = await ApiBpmn.setNodeAdditions({
        connection,
        runner,
        client,
        node: {id: args.idNI},
        additions,
      })
      if (worker) {
        worker.postChangedNodes([
          result.nodeInstance,
          ...result.targetNodeInstances,
        ])
      }
      // @ts-ignore
      return result.nodeInstance as GQLTypes.NodeElementInstance
    }
    return null
  },
  withdrawnProcess: async(_, args, { client, db: connection, runner, worker }) => {
    if (runner) {
      const result = await ApiBpmn.withdrawnProcess({
        connection,
        client,
        runner,
      })
      if (result) {
        if (worker) {
          worker.postChangedProcess(result.processInstance)
          worker.postChangedNodes([...result.targetNodeInstances])
        }
        // @ts-ignore
        return result.processInstance as GQLTypes.ProcessInstance
      }
    }
    return null
  },
}

export const ProcessTemplate: GQLTypes.ProcessTemplateResolvers = {
  instances: async(parrent, args, { db: connection, client }) => {
    // @ts-ignore
    let template = parrent as Bpmn.ProcessTemplate
    let res: any
    if (template.processInstances) {
      res = template.processInstances
    } else {
      res = await connection.manager.find(Bpmn.ProcessInstance, {
        where: {processTemplateId: template.id},
      })
    }
    // @ts-ignore
    return res as GQLTypes.ProcessInstance[]
  },
  dataObjects: async(parrent, args, { db: connection, client }) => {
    // @ts-ignore
    let template = parrent as { id: number }
    let res = await ApiProcessT.getDataObjects({
      connection,
      client,
      filter: { processTemplateId: template.id },
    })
    // @ts-ignore
    return res as GQLTypes.DataObjectTemplate[]
  },
  nodeElements: async(parrent, args, { db: connection, client }) => {
    // @ts-ignore
    let template = parrent as { id: number }
    let res = await ApiProcessT.getNodeElements({
      connection,
      client,
      filter: { processTemplateId: template.id },
    })
    // @ts-ignore
    return res as GQLTypes.NodeElementTemplate[]
  },
}
