import { Connection } from 'typeorm'

import { DataObjectTemplate } from '../../src/entity/bpmn/dataObject'
import { GatewayDirection, GatewayTemplate, GatewayType } from '../../src/entity/bpmn/gateway'
import { ProcessTemplate, ProcessType, VersionType } from '../../src/entity/bpmn/process'
import { SequenceFlowTemplate } from '../../src/entity/bpmn/sequenceFlow'
import { NodeToSequenceFlow, SequenceFlowToNode } from '../../src/entity/bpmn/sequenceFlowToNode'
import { TaskTemplate } from '../../src/entity/bpmn/task'
import { cleanDataInTables, closeConn, createConn } from '../../src/utils/db'

const printJSON = false

let connection: Connection

describe('Testovani entit ', () => {
  beforeEach(async () => {
    connection = await createConn()
    await cleanDataInTables(connection, connection.entityMetadatas)
  })
  afterEach(async () => {
    await closeConn(connection)
  })
  describe('Vytvareni novych zakladnich entit', () => {

    it('ProcessTemplate vychozi', async () => {
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

    it('ProcessTemplate N-krat', async () => {
      const count = 10
      for (let i = 0; i < count; i++) {
        let process = new ProcessTemplate()
        process.name = `process${i}`
        process.processType = ProcessType.Private
        process.version = `${i}`
        await connection.manager.save(process)
      }
      const arr = await connection.getRepository(ProcessTemplate).find({
        order: { name: 'ASC' }
      })
      expect(arr.length).toBe(count)
      for (let i = 0; i < arr.length; i++) {
        expect(arr[i].name).toBe(`process${i}`)
        expect(arr[i].version).toBe(`${i}`)
        expect(arr[i].processType).toBe(ProcessType.Private)
      }
    })


    it('TaskTemplate vychozi', async () => {
      let task = new TaskTemplate()
      await connection.manager.save(task)

      const res = await connection.getRepository(TaskTemplate).findOneOrFail()

      printJSON && console.log(JSON.stringify(res, undefined, 2))

      expect(res.name).toBe('')
      expect(typeof res.bpmnId).toBe('string')
    })

    it('GatewayTemplate vychozi', async () => {
      let gate = new GatewayTemplate()
      await connection.manager.save(gate)

      const res = await connection.getRepository(GatewayTemplate).findOneOrFail()

      printJSON && console.log(JSON.stringify(res, undefined, 2))

      expect(res.name).toBe('')
      expect(typeof res.bpmnId).toBe('string')
      expect(res.type).toBe(GatewayType.Exclusive)
      expect(res.direction).toBe(GatewayDirection.Unspecified)
    })

    it('SequenceFlowTemplate vychozi', async () => {
      let seq = new SequenceFlowTemplate()
      await connection.manager.save(seq)

      const res = await connection.getRepository(SequenceFlowTemplate).findOneOrFail()

      printJSON && console.log(JSON.stringify(res, undefined, 2))

      expect(res.name).toBe('')
      expect(typeof res.bpmnId).toBe('string')
      expect(res.expression).toBe('')
    })

    it('DataObjectTemplate vychozi', async () => {
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

  describe('Testovani vztahu mezi entitami', () => {
    it('Task s 1x vstupnimi daty a 1x vystupnimi daty',async()=>{
      const
        input = new DataObjectTemplate(),
        output = new DataObjectTemplate(),
        task = new TaskTemplate()

      input.name = 'taskInput'
      input.json = { data: true }

      output.name = 'taskOutput'
      output.json = { data: false }

      task.name = 'taskWithData'
      task.inputs = [input]
      task.outputs = [output]

      await connection.manager.save([input, output])
      await connection.manager.save(task)

      const resTask = await connection.getRepository(TaskTemplate).findOneOrFail({
        relations: ['inputs', 'outputs'],
      })
      expect(resTask.name).toBe('taskWithData')

      // Existence vstupu v uloze
      if (!resTask.inputs) throw new Error('inputs undefined')
      expect(resTask.inputs.length).toBe(1)
      resTask.inputs.forEach(input => {
        expect(input.name).toBe('taskInput')
        expect(input.json).toMatchObject({ data: true})
      })

      // Existence vystupu v ulohy
      if (!resTask.outputs) throw new Error('outputs undefined')
      expect(resTask.outputs.length).toBe(1)
      resTask.outputs.forEach(output => {
        expect(output.name).toBe('taskOutput')
        expect(output.json).toMatchObject({ data: false })
      })

    })

    it('2x Task spojene s 1x SequenceFlow',async()=>{
      const tasks = [new TaskTemplate(), new TaskTemplate()]
          , sequence = new SequenceFlowTemplate()
          // , target = new SequenceFlowToNode()
          // , source = new NodeToSequenceFlow()

      tasks[0].name = 'task0'
      tasks[1].name = 'task1'
      sequence.name = 'sequence'

      // await connection.manager.save([...tasks, sequence])

      const source = new NodeToSequenceFlow({
        sequenceFlow: sequence,
        task: tasks[0],
      })
      // const target = new SequenceFlowToNode({
      //   sequenceFlow: sequence,
      //   task: tasks[1],
      // })
      const target = new SequenceFlowToNode()
      target.task = tasks[1]

      await connection.manager.save([...tasks])
      sequence.source = source
      sequence.target = target
      await connection.manager.save([sequence])

      // source.task = tasks[0]
      // source.sequenceFlow = sequence
      // target.task = tasks[1]
      // target.sequenceFlow = sequence

      // await connection.manager.save([source, target])

      // Testovani z pohledu spoje
      const resSeq = await connection.getRepository(SequenceFlowTemplate)
        .findOneOrFail(sequence.id, {
          relations: ['target', 'source', 'source.task', 'target.task'],
        })

      expect(resSeq.name).toBe('sequence')
      if(!resSeq || !resSeq.source || !resSeq.source.task)
        throw new Error('undefined')
      expect(resSeq.source.task.name).toBe('task0')

      if (!resSeq || !resSeq.target || !resSeq.target.task)
        throw new Error('undefined')
      expect(resSeq.target.task.name).toBe('task1')

      // Testovani z pohledu uloh
      const resTasks = await connection.getRepository(TaskTemplate)
        .find({
          relations: ['incoming', 'outgoing', 'incoming.sequenceFlow', 'outgoing.sequenceFlow'],
        })

      if(!resTasks) throw new Error('undefined')
      expect(resTasks.length).toBe(2)
      resTasks.forEach(task => {
        if (!task.outgoing || !task.incoming) throw new Error()
        // Uloha 0 - jeden odchozi a 0 prichozi
        if (task.name === 'task0') {
          expect(task.incoming.length).toBe(0)
          expect(task.outgoing.length).toBe(1)
          task.outgoing.forEach( seq => {
            if (!seq.sequenceFlow) throw new Error()
            expect(seq.sequenceFlow.name).toBe('sequence')
          })
        } else {
          expect(task.outgoing.length).toBe(0)
          expect(task.incoming.length).toBe(1)
          task.incoming.forEach(seq => {
            if (!seq.sequenceFlow) throw new Error()
            expect(seq.sequenceFlow.name).toBe('sequence')
          })
        }
      })

    })
  })

})

