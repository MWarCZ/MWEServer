import { Column, Entity, JoinColumn, ManyToOne, OneToOne, PrimaryGeneratedColumn } from 'typeorm'

import { BasicTaskTemplate } from './basicTask'
import { EventTemplate } from './event'
import { GatewayTemplate } from './gateway'
import { SequenceFlowTemplate } from './sequenceFlow'
import { TaskTemplate } from './task'

interface OptionsS2FEvent {
  sequenceFlow: SequenceFlowTemplate,
  event: EventTemplate,
}
interface OptionsS2FTask {
  sequenceFlow: SequenceFlowTemplate,
  task: TaskTemplate,
}
interface OptionsS2FGateway {
  sequenceFlow: SequenceFlowTemplate,
  gateway: GatewayTemplate,
}
export type OptionsSequenceFlowToNode = OptionsS2FEvent | OptionsS2FTask | OptionsS2FGateway

// @Entity()
// @TableInheritance({ column: { type: "varchar", name: "class" } })
export class ConnectorNodeAndSequence {
  @PrimaryGeneratedColumn()
  id?: number

  @Column({ nullable: true })
  sequenceFlowId?: number

  @ManyToOne(type => BasicTaskTemplate, { onDelete: 'CASCADE' })
  task?: BasicTaskTemplate
  @Column({ nullable: true })
  taskId?: number

  @ManyToOne(type => GatewayTemplate, { onDelete: 'CASCADE' })
  gateway?: GatewayTemplate
  @Column({ nullable: true })
  gatewayId?: number

  @ManyToOne(type => EventTemplate, { onDelete: 'CASCADE'})
  event?: EventTemplate
  @Column({ nullable: true })
  eventId?: number

  constructor(options?: OptionsSequenceFlowToNode) {
    if (!!options) {
      Object.keys(options).forEach(key => {
        (this as any)[key] = (options as any)[key]
      })
    }
  }
}

@Entity()
export class ConnectorNode2Sequence extends ConnectorNodeAndSequence {

  @OneToOne(type => SequenceFlowTemplate, entity => entity.source, { onDelete: 'CASCADE' })
  @JoinColumn()
  sequenceFlow?: SequenceFlowTemplate
}

@Entity()
export class ConnectorSequence2Node extends ConnectorNodeAndSequence {

  @OneToOne(type => SequenceFlowTemplate, entity => entity.target, { onDelete: 'CASCADE' })
  @JoinColumn()
  sequenceFlow?: SequenceFlowTemplate

}
