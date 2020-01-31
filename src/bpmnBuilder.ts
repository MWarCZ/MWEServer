import { BaseElementTemplate, OptionsBaseElement } from 'entity/bpmn/baseElement'
import { DataObjectTemplate } from 'entity/bpmn/dataObject'
import { OptionsProcess, ProcessTemplate } from 'entity/bpmn/process'
import { SequenceFlowTemplate } from 'entity/bpmn/sequenceFlow'
import { TaskTemplate } from 'entity/bpmn/task'
import { Connection } from 'typeorm'
import { v4 as uuid } from 'uuid'

interface bpmnMapElement {
  element: BaseElementTemplate,
  level: BpmnLevel,
}

interface BpmnMap {
  [bpmnId: string]: bpmnMapElement
}

/*
  L0 - definitions
  L1 - process, colaborations, ...
  L2 - task, startEvent, exclusiveGateway, dataObject, ...
  L3 - association
*/

enum BpmnLevel {
  L0 = 0, // definitions (namespaces)
  L1 = 1, // process, colaborations, ...
  L2 = 2, // task, startEvent, exclusiveGateway, dataObject, ...
  L3 = 3, //
}

type xxx = Partial<OptionsProcess> & {
  bpmnId: string
}

interface IBpmnBuilder {
  process(processOpts: Partial<OptionsProcess>): IProcessBuilder,
}
interface IProcessBuilder {
  task(taskOpts: Partial<OptionsProcess>): ITaskBuilder,
  up(): IBpmnBuilder,
}
interface ITaskBuilder {
  up(): IProcessBuilder,
}

export class BpmnBuilder implements IBpmnBuilder, IProcessBuilder{
  bpmnMap: BpmnMap = {}
  connection: Connection
  last: {
    process?: ProcessTemplate,
    task?: TaskTemplate,
    sequenceFlow?: SequenceFlowTemplate,
    dataObject?: DataObjectTemplate,
  } = {}

  constructor (connection: Connection) {
    this.connection = connection
  }

  process(processOpts: Partial<OptionsProcess>): this {
    const opts = this.getOptions(processOpts)
    const process = new ProcessTemplate(opts)
    this.bpmnMap[opts.bpmnId] = {
      element: process,
      level: BpmnLevel.L1,
    }
    this.last.process = process
    return this
  }
  task(taskOpts: Partial<OptionsProcess>): this {
    const opts = this.getOptions(taskOpts)
    const task = new TaskTemplate()
    task.processTemplate = this.last.process
    this.bpmnMap[opts.bpmnId] = {
      element: task,
      level: BpmnLevel.L2,
    }
    return this
  }
  sequenceFlow(){

  }
  sequence2node(){

  }

  up(): this {
    return this
  }

  save(): void {
    const bpmnIds = Object.keys(this.bpmnMap)
    const bpmnElements = bpmnIds.map(bpmnId => this.bpmnMap[bpmnId])
    for (let i: BpmnLevel = BpmnLevel.L1; i <= BpmnLevel.L3; i++) {

      const levelElement = bpmnElements.filter(bpmnElement => bpmnElement.level === i)
      const element = levelElement.map(el=>el.element)

      this.connection.manager.save([...element])
    }

  }


  private getOptions<T extends Partial<OptionsBaseElement>>(options: T): T & OptionsBaseElement {
    const {
      bpmnId = uuid(),
      name = '',
    } = options
    return { ...options, bpmnId, name}
  }
}
