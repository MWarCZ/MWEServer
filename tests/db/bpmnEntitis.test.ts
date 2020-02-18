import 'jest-extended'

import { Connection } from 'typeorm'

import { DataObjectTemplate, ProcessTemplate, ProcessType, SequenceFlowTemplate, VersionType } from '../../src/entity/bpmn'
import { cleanDataInTables, closeConn, createConn } from '../../src/utils/db'

const printJSON = false

let connection: Connection

describe('Testovani entit ', () => {
  beforeEach(async() => {
    connection = await createConn()
    await cleanDataInTables(connection, connection.entityMetadatas)
  })
  afterEach(async() => {
    await closeConn(connection)
  })
  describe('Vytvareni novych zakladnich entit', () => {

    it('ProcessTemplate vychozi', async() => {
      let process = new ProcessTemplate()
      await connection.manager.save(process)

      const res = await connection.getRepository(ProcessTemplate).findOneOrFail()

      printJSON && console.log(JSON.stringify(res, undefined, 2))

      expect(res.name).toBe('')
      expect(res.version).toBe('1')
      expect(res.versionType).toBe(VersionType.number)
      expect(res.processType).toBe(ProcessType.None)
      expect(res.isExecutable).toBeFalsy()
      expect(typeof res.bpmnId).toBe('string')
    })

    it('ProcessTemplate N-krat', async() => {
      const count = 10
      for (let i = 0; i < count; i++) {
        let process = new ProcessTemplate()
        process.name = `process${i}`
        process.processType = ProcessType.Private
        process.version = `${i}`
        await connection.manager.save(process)
      }
      const arr = await connection.getRepository(ProcessTemplate).find({
        order: { name: 'ASC' },
      })
      expect(arr.length).toBe(count)
      for (let i = 0; i < arr.length; i++) {
        expect(arr[i].name).toBe(`process${i}`)
        expect(arr[i].version).toBe(`${i}`)
        expect(arr[i].processType).toBe(ProcessType.Private)
      }
    })

    it('SequenceFlowTemplate vychozi', async() => {
      let seq = new SequenceFlowTemplate()
      await connection.manager.save(seq)

      const res = await connection.getRepository(SequenceFlowTemplate).findOneOrFail()

      printJSON && console.log(JSON.stringify(res, undefined, 2))

      expect(res.name).toBe('')
      expect(typeof res.bpmnId).toBe('string')
      expect(res.expression).toBe('')
    })

    it('DataObjectTemplate vychozi', async() => {
      let data = new DataObjectTemplate()
      await connection.manager.save(data)

      const res = await connection.getRepository(DataObjectTemplate).findOneOrFail()

      printJSON && console.log(JSON.stringify(res, undefined, 2))

      expect(res.name).toBe('')
      expect(typeof res.bpmnId).toBe('string')
      expect(res.strict).toBeFalsy()
      expect(res.json).toMatchObject({})
    })

  })

})

