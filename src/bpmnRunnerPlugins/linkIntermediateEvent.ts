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
  run({ initNext, context }) {
    let links = context.$NODES.filter(node => {
      return node.name === context.$SELF.name
    })
    initNext(links)
    return links
  },
}

export const LinkIntermediateCatchEvent: NodeImplementation = {
  run() { return true },
  onCompleting({ initNext, context }) {
    initNext(context.$OUTGOING)
  },
}
