///////////////////////////////////////
// Soubor: src/bpmnRunnerPlugins/startEvent.ts
// Projekt: MWEServer
// Autor: Miroslav Válka
///////////////////////////////////////
import { NodeImplementation } from '../bpmnRunner'

/**
 *
 */
export const StartEvent: NodeImplementation = {
  run() { },
  onCompleting({ fn, context }) {
    // console.log({ o: context.$OUTGOING})
    if (!fn.initNext) return
    fn.initNext(context.$OUTGOING)
  },
}
