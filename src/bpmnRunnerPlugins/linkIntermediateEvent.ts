import { NodeImplementation, SupportedNode } from '../bpmnRunner'

/**
 *
 */
export const LinkIntermediateThrowEvent: NodeImplementation = {
  options: {
    provideNodes: (node) => {
      return node.implementation === SupportedNode.LinkIntermediateCatchEvent
    },
  },
  run({ fn, context }) {
    let links = context.$NODES.filter(node => {
      return node.name === context.$SELF.name
    })
    if (!fn.initNext) return
    fn.initNext(links)
    return links
  },
}

export const LinkIntermediateCatchEvent: NodeImplementation = {
  run() { return true },
  onCompleting({ fn, context }) {
    if (!fn.initNext) return
    fn.initNext(context.$OUTGOING)
  },
}
