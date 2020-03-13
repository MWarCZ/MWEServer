import { join as pathJoin } from 'path'

import { Group, Member, User } from '../../src/entity'
import {
  DataObjectInstance,
  DataObjectTemplate,
  NodeElementInstance,
  NodeElementTemplate,
  ProcessInstance,
  ProcessTemplate,
  SequenceFlowInstance,
  SequenceFlowTemplate,
} from '../../src/entity/bpmn'
import { createConn, loadDataToDb } from '../../src/utils/db'

let path = pathJoin(__dirname, '../resources/db/UGM')

console.warn(path)
console.error(process.argv)


const Entities = {
  UGM: [User, Group, Member],
  BPMN_TEMPLATE: [ProcessTemplate, DataObjectTemplate, NodeElementTemplate, SequenceFlowTemplate],
  BPMN_INSTANCE: [ProcessInstance, DataObjectInstance, NodeElementInstance, SequenceFlowInstance],
}

async function run() {
  for (let argv of process.argv) {
    try {
      let [name, path] = argv.split('=')
      let selected = (Entities as any)[name]
      if (selected) {
        let connection = await createConn()
        let absPath = pathJoin(__dirname, path)
        await loadDataToDb(connection, selected, absPath)
        console.log(`(OK) ${name}: ${path}`)
      } else {
        console.log(`(??) ${argv}`)
      }
    } catch (e) {
      console.log(`(KO) ${name}: ${path}`)
      console.error(e)
    }
  }
  process.exit(0)
}

run()

// createConn()
//   .then(connection => loadDataToDb(connection, [User, Group, Member], path))
//   .then(x=>console.error('OK',x))
//   .catch(x=>console.error('KO',x))

