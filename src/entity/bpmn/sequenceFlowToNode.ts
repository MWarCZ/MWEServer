import { Entity, JoinColumn, ManyToOne, OneToOne, PrimaryGeneratedColumn } from 'typeorm'

import { EventTemplate } from './event'
import { GatewayTemplate } from './gateway'
import { SequenceFlowTemplate } from './sequenceFlow'
import { TaskTemplate } from './task'

interface OptionsEvent {
  sequenceFlow: SequenceFlowTemplate,
  event: EventTemplate,
}
interface OptionsTask {
  sequenceFlow: SequenceFlowTemplate,
  task: TaskTemplate,
}
interface OptionsGateway {
  sequenceFlow: SequenceFlowTemplate,
  gateway: GatewayTemplate,
}
export type OptionsSequenceFlowToNode = OptionsEvent | OptionsTask | OptionsGateway

@Entity()
// @TableInheritance({ column: { type: "varchar", name: "class" } })
export class SequenceFlowToNode {
  @PrimaryGeneratedColumn()
  id?: number

  @OneToOne(type => SequenceFlowTemplate, { onDelete: 'CASCADE' })
  @JoinColumn()
  sequenceFlow?: SequenceFlowTemplate

  @ManyToOne(type => TaskTemplate, { onDelete: 'CASCADE' })
  task?: TaskTemplate

  @ManyToOne(type => GatewayTemplate, { onDelete: 'CASCADE' })
  gateway?: GatewayTemplate

  @ManyToOne(type => EventTemplate, { onDelete: 'CASCADE'})
  event?: EventTemplate

  constructor(options?: OptionsSequenceFlowToNode){
    if(!!options) {
      Object.keys(options).forEach(key => {
        (this as any)[key] = (options as any)[key]
      })
    }
  }
}

@Entity()
export class NodeToSequenceFlow extends SequenceFlowToNode {

}
