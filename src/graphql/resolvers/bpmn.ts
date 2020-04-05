import * as ApiBpmn from '../../api/bpmn'
import * as ApiDataI from '../../api/bpmn/dataObjectInstance'
import * as ApiDataT from '../../api/bpmn/dataObjectTemplate'
import * as ApiNodeI from '../../api/bpmn/nodeElementInstance'
import * as ApiNodeT from '../../api/bpmn/nodeElementTemplate'
import * as ApiProcessI from '../../api/bpmn/processInstance'
import * as ApiProcessT from '../../api/bpmn/processTemplate'
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
    console.log('=ssssssssssssssss')
    if (runner) {
      const result = await ApiBpmn.getNodeAdditionsFormat({
        connection,
        runner,
        client,
        node: {id: args.idNI },
      })
      console.log('====>', result)
      let arr:any = []
      for (let key in result) {
        let item = result[key]
        arr.push({
          ...item,
          name: key,
        })
      }
      // @ts-ignore
      return arr as GQLTypes.NodeAdditions[]
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
        processInstance: {id: args.idPI},
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
  claimNodeInstance: async(_, args, { client, db: connection, runner, worker }) => {
    if (runner) {
      const result = await ApiBpmn.claimNodeInstance({
        connection,
        client,
        nodeInstance: { id: args.idNI },
      })
      if (result) {
        if (worker) {
          worker.postChangedNodes([result])
        }
        // @ts-ignore
        return result as GQLTypes.NodeElementInstance
      }
    }
    return null
  },
  releaseNodeInstance: async(_, args, { client, db: connection, runner, worker }) => {
    if (runner) {
      const result = await ApiBpmn.releaseNodeInstance({
        connection,
        client,
        nodeInstance: { id: args.idNI },
      })
      if (result) {
        if (worker) {
          worker.postChangedNodes([result])
        }
        // @ts-ignore
        return result as GQLTypes.NodeElementInstance
      }
    }
    return null
  },
  deleteProcessTemplate: async(_, args, { client, db: connection }) => {
    let result = await ApiBpmn.deleteProcessTemplate({
      connection,
      client,
      processTemplate: { id: args.idPT },
    })
    return result
  },
  deleteProcessInstance: async(_, args, { client, db: connection }) => {
    let result = await ApiBpmn.deleteProcessInstance({
      connection,
      client,
      processInstance: { id: args.idPI },
    })
    return result
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
      // res = await connection.manager.find(Bpmn.ProcessInstance, {
      //   where: {processTemplateId: template.id},
      // })
      res = await ApiProcessT.getInstances({
        connection,
        client,
        filter: { processTemplateId: template.id as number },
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
  candidateGroup: async(parrent, args, { db: connection, client }) => {
    // @ts-ignore
    let template = parrent as Bpmn.ProcessTemplate
    if (!template.candidateManager) {
      return null
    }
    let res = await ApiProcessT.getCandidateGroup({
      connection,
      client,
      filter: { groupName: template.candidateManager },
    })

    // @ts-ignore
    return res as GQLTypes.Group
  },
}

export const ProcessInstance: GQLTypes.ProcessInstanceResolvers = {
  template: async(parrent, args, { db: connection, client }) => {
    // @ts-ignore
    let template = parrent as Bpmn.ProcessInstance
    let res: any
    if (template.processTemplate) {
      res = template.processTemplate
    } else {
      res = await ApiProcessI.getTemplate({
        connection,
        client,
        filter: { idProcessTemplate: template.processTemplateId as number },
      })
    }
    // @ts-ignore
    return res as GQLTypes.ProcessTemplate
  },
  dataObjects: async(parrent, args, { db: connection, client }) => {
    // @ts-ignore
    let template = parrent as Bpmn.ProcessInstance
    let res: any
    if (template.dataObjects) {
      res = template.dataObjects
    } else {
      res = await ApiProcessI.getDataObjects({
        connection,
        client,
        filter: { processInstanceId: template.id as number },
      })
    }
    // @ts-ignore
    return res as GQLTypes.DataObjectInstance[]
  },
  nodeElements: async(parrent, args, { db: connection, client }) => {
    // @ts-ignore
    let template = parrent as Bpmn.ProcessInstance
    let res: any
    if (template.nodeElements) {
      res = template.nodeElements
    } else {
      res = await ApiProcessI.getNodeElements({
        connection,
        client,
        filter: { idProcessInstance: template.id as number },
      })
    }
    // @ts-ignore
    return res as GQLTypes.NodeElementInstance[]
  },
}

export const NodeElementTemplate: GQLTypes.NodeElementTemplateResolvers = {
  instances: async(parrent, args, { db: connection, client }) => {
    // @ts-ignore
    let template = parrent as Bpmn.NodeElementTemplate
    let res: any
    if (template.instances) {
      res = template.instances
    } else {
      res = await ApiNodeT.getInstances({
        connection,
        client,
        filter: { nodeTemplateId: template.id as number },
      })
    }
    // @ts-ignore
    return res as GQLTypes.NodeElementInstance[]
  },
  processTemplate: async(parrent, args, { db: connection, client }) => {
    // @ts-ignore
    let template = parrent as Bpmn.NodeElementTemplate
    let res: any
    if (template.processTemplate) {
      res = template.processTemplate
    } else {
      res = await ApiNodeT.getProcessTemplate({
        connection,
        client,
        filter: { processTemplateId: template.processTemplateId as number },
      })
    }
    // @ts-ignore
    return res as GQLTypes.ProcessTemplate
  },
  candidateGroup: async(parrent, args, { db: connection, client }) => {
    // @ts-ignore
    let template = parrent as Bpmn.NodeElementTemplate
    let res: any

    res = await ApiNodeT.getCandidateGroup({
      connection,
      client,
      filter: { groupName: template.candidateAssignee },
    })

    // @ts-ignore
    return res as GQLTypes.Group
  },
}

export const NodeElementInstance: GQLTypes.NodeElementInstanceResolvers = {
  template: async(parrent, args, { db: connection, client }) => {
    // @ts-ignore
    let template = parrent as Bpmn.NodeElementInstance
    let res: any
    if (template.template) {
      res = template.template
    } else {
      res = await ApiNodeI.getTemplate({
        connection,
        client,
        filter: { nodeTemplateId: template.templateId as number },
      })
    }
    // @ts-ignore
    return res as GQLTypes.NodeElementTemplate
  },
  processInstance: async(parrent, args, { db: connection, client }) => {
    // @ts-ignore
    let template = parrent as Bpmn.NodeElementInstance
    let res: any
    if (template.processInstance) {
      res = template.processInstance
    } else {
      res = await ApiNodeI.getProcessInstance({
        connection,
        client,
        filter: { processInstanceId: template.processInstanceId as number },
      })
    }
    // @ts-ignore
    return res as GQLTypes.ProcessInstance
  },
  assignee: async(parrent, args, { db: connection, client }) => {
    // @ts-ignore
    let template = parrent as Bpmn.NodeElementInstance
    let res: any
    res = await ApiNodeI.getAssignee({
      connection,
      client,
      filter: { userId: template.assigneeId as number },
    })
    // @ts-ignore
    return res as GQLTypes.User
  },
}

export const DataObjectTemplate: GQLTypes.DataObjectTemplateResolvers = {
  instances: async(parrent, args, { db: connection, client }) => {
    // @ts-ignore
    let template = parrent as Bpmn.DataObjectTemplate
    let res: any
    if (template.instances) {
      res = template.instances
    } else {
      res = await ApiDataT.getInstances({
        connection,
        client,
        filter: { dataTemplateId: template.id as number },
      })
    }
    // @ts-ignore
    return res as GQLTypes.DataObjectInstance[]
  },
}

export const DataObjectInstance: GQLTypes.DataObjectInstanceResolvers = {
  template: async(parrent, args, { db: connection, client }) => {
    // @ts-ignore
    let template = parrent as Bpmn.DataObjectInstance
    let res: any
    if (template.template) {
      res = template.template
    } else {
      res = await ApiDataI.getTemplate({
        connection,
        client,
        filter: { dataTemplateId: template.templateId as number },
      })
    }
    // @ts-ignore
    return res as GQLTypes.DataObjectTemplate
  },
  processInstance: async(parrent, args, { db: connection, client }) => {
    // @ts-ignore
    let template = parrent as Bpmn.DataObjectInstance
    let res: any
    if (template.processInstance) {
      res = template.processInstance
    } else {
      res = await ApiDataI.getProcessInstance({
        connection,
        client,
        filter: { processInstanceId: template.processInstanceId as number },
      })
    }
    // @ts-ignore
    return res as GQLTypes.ProcessInstance
  },

}
