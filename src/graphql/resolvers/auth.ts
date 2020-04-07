import * as ApiAuth from '../../api/auth'
import { GQLTypes } from '../generated/types'

export const Mutation: GQLTypes.MutationResolvers = {
  login: async(_, args, context) => {
    // console.log(args)
    let expires = (args.input.expires) ? args.input.expires : '30m'
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
        user, expiresIn: expires,
      })
      // @ts-ignore
      return {
        token,
        user,
      } as GQLTypes.LoginPayload
    }
    return null
  },
}
