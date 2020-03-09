import * as ApiAuth from '../../api/auth'
import { GQLTypes } from '../generated/types'

export const Mutation: GQLTypes.MutationResolvers = {
  login: async(_, args, context) => {
    let user = await ApiAuth.authenticateLocal({
      request: context.request,
      response: context.response,
      auth: {
        username: args.input.login,
        password: args.input.password,
      },
    })
    if (user) {
      let token = ApiAuth.genJwt({
        user, expiresIn: '30m',
      })
      return token
    }
    return null
  },
}
