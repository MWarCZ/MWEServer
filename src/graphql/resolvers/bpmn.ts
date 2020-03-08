import * as ApiBpmn from '../../api/bpmn'
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
  initProcess: async(_, { input }, { client, db: connection }) => {
    let process = await ApiBpmn.initProcess({
      connection,
      client,
      data: {
        processId: input.idProcess,
        firstNodeId: input.idFirstNode,
      },
    })
    // @ts-ignore
    return process as GQLTypes.ProcessInstance
  },
}

export const ProcessTemplate: GQLTypes.ProcessTemplateResolvers = {
  // instances: async (parrent, args, {db: connection, client}, info) => {
  //   let member = parrent as EntityMember
  //   let user = await ApiMember.getUser({
  //     connection,
  //     client,
  //     filter: { id: member.userId as number },
  //   })
  //   // @ts-ignore
  //   return user as GQLTypes.ProcessInstance[]
  // },
}
