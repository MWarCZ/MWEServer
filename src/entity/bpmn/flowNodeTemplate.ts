import { Entity, ManyToOne, TableInheritance } from 'typeorm'

import { BaseElementTemplate } from './baseElement'
import { SequenceFlowTemplate } from './sequenceFlow'

/**
 * Entita predstavujici uzly v diagramu bpmn.
 * Do uzlu vedou a z uzlu vychazi propoje.
 * Uzly napr. task, gateway, dataobject, event.
 */
@Entity()
@TableInheritance({ column: { type: "varchar", name: "flow_node_type" } })
export class FlowNodeTemplate extends BaseElementTemplate {
// export abstract class FlowNodeTemplate extends BaseElementTemplate {
  @ManyToOne(type => SequenceFlowTemplate, entity => entity.target)
  incoming?: SequenceFlowTemplate[]

  @ManyToOne(type => SequenceFlowTemplate, entity => entity.source)
  outgoing?: SequenceFlowTemplate[]
}
