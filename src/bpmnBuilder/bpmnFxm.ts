
export declare namespace BpmnFxm {
  /** XML Elements */

  type BaseElementAttr = {
    id?: string,
    name?: string,
  }
  type NodeElementAttr = {
    implementation?: string,
  } & BaseElementAttr
  type NodeElement = {
    '#attr'?: NodeElementAttr,
    dataOutputAssociation?: DataOutputAssociation[],
    dataInputAssociation?: DataInputAssociation[],
    incoming?: string | string[], /** */
    outgoing?: string | string[], /** */
  }

  type DefinitionsAttr = {
    [key: string]: string,
    targetNamespace: string,
  } & BaseElementAttr
  type Definitions = {
    '#attr'?: DefinitionsAttr,
    process?: Process[],
    collaboration?: Collaboration[],
  }

  type ProcessAttr = {
    isExecutable?: boolean,
    processType?: string,
    versionType?: string,
    version?: string,
  } & BaseElementAttr
  type Process = {
    '#attr'?: ProcessAttr,
    // tasks
    task?: Task[],
    scriptTask?: ScriptTask[], /** */
    serviceTask?: ServiceTask[], /** */
    sendTask?: Task[], /** */
    receiveTask?: Task[], /** */
    userTask?: Task[], /** */
    manualTask?: Task[], /** */
    callActivity?: Task[], /** */
    businessRuleTask?: Task[], /** */
    // sequence
    sequenceFlow?: SequenceFlow[],
    // data
    dataObject?: DataObject[],
    dataObjectReference?: DataObjectReference[],
    // events
    startEvent?: StartEvent[],
    endEvent?: EndEvent[],
    intermediateThrowEvent?: IntermediateThrowEvent[],
    intermediateCatchEvent?: IntermediateCatchEvent[],
    // gateway
    parallelGateway?: ParallelGateway[], /** */
    exclusiveGateway?: ExclusiveGateway[], /** */
    inclusiveGateway?: InclusiveGateway[], /** */
    // lane
    laneSet?: LaneSet[], /** */
  }

  type DataObjectAttr = {
    strict?: boolean,
  } & BaseElementAttr
  type DataObject = {
    '#attr'?: DataObjectAttr,
    extensionElements?: {
      json?: string | Json[],
    }[],
  }

  type JsonAttr = {}
  type Json = {
    '#attr'?: JsonAttr,
    '#text'?: string,
  }

  type DataObjectReferenceAttr = {
    dataObjectRef?: string,
  } & BaseElementAttr
  type DataObjectReference = {
    '#attr'?: DataObjectReferenceAttr,
  }


  type TaskAttr = {
    implementation?: string,
  } & NodeElementAttr
  type Task = {
    '#attr'?: TaskAttr,
    dataOutputAssociation?: DataOutputAssociation[],
    dataInputAssociation?: DataInputAssociation[],
    property?: Property[],
    incoming?: string | string[], /** */
    outgoing?: string | string[], /** */
  }

  type ScriptTaskAttr = {
    scriptFormat?: string,
  } & TaskAttr
  type ScriptTask = {
    '#attr'?: ScriptTaskAttr,
    script?: string,
  } & Task

  type ServiceTaskAttr = {
  } & TaskAttr
  type ServiceTask = {
    '#attr'?: ServiceTaskAttr,
  } & Task
  let t:ScriptTask


  type PropertyAttr = {} & BaseElementAttr
  type Property = {
    '#attr'?: PropertyAttr,
    '#text'?: string,
  }

  type DataOutputAssociationAttr = {} & BaseElementAttr
  type DataOutputAssociation = {
    '#attr'?: DataOutputAssociationAttr,
    sourceRef?: string | SourceRef[],
    targetRef?: string | TargetRef[],
  }
  type DataInputAssociationAttr = DataOutputAssociationAttr
  type DataInputAssociation = {
    '#attr'?: DataInputAssociationAttr,
    sourceRef?: string | SourceRef[],
    targetRef?: string | TargetRef[],
  }
  type SourceRefAttr = {}
  type SourceRef = {
    '#attr'?: SourceRefAttr,
    '#text'?: string,
  }
  type TargetRefAttr = {}
  type TargetRef = {
    '#attr'?: TargetRefAttr,
    '#text'?: string,
  }

  type SequenceFlowAttr = {
    sourceRef?: string,
    targetRef?: string,
  } & BaseElementAttr
  type SequenceFlow = {
    '#attr'?: SequenceFlowAttr,
    expression?: string | Expression[],
    conditionExpression?: string | ConditionExpression[],
  }
  type ExpressionAttr = {} & BaseElementAttr
  type Expression = {
    '#attr'?: ExpressionAttr,
    '#text'?: string,
  }
  type ConditionExpressionAttr = {
    language?: string,
    type?: string,
  } & ExpressionAttr
  type ConditionExpression = {
    '#attr'?: ConditionExpressionAttr,
    '#text'?: string,
  }

  type StartEventAttr = {
    eventDefinitionRefs?: string,
  } & NodeElementAttr
  type StartEvent = {
    '#attr'?: StartEventAttr,
    outgoing?: string | string[], /** */
    conditionalEventDefinition?: string | ConditionalEventDefinition[], /** */
    timerEventDefinition?: string | TimerEventDefinition[], /** */
    // linkEventDefinition?: string, /** */
    messageEventDefinition?: string | MessageEventDefinition[], /** */
    // errorEventDefinition?: string, /** */
    signalEventDefinition?: string | SignalEventDefinition[], /** */
  }
  type EndEventAttr = {
    eventDefinitionRefs?: string,
  } & NodeElementAttr
  type EndEvent = {
    '#attr'?: EndEventAttr,
    incoming?: string | string[], /** */
    // linkEventDefinition?: string | LinkEventDefinition[], /** */
    messageEventDefinition?: string | MessageEventDefinition[], /** */
    errorEventDefinition?: string | ErrorEventDefinition[], /** */
    signalEventDefinition?: string | SignalEventDefinition[], /** */
    terminateEventDefinition?: string | TerminateEventDefinition[], /** */
  }
  type IntermediateThrowEventAttr = {
    eventDefinitionRefs?: string,
  } & NodeElementAttr
  type IntermediateThrowEvent = {
    '#attr'?: IntermediateThrowEventAttr,
    outgoing?: string | string[], /** */
    linkEventDefinition?: string | LinkEventDefinition[], /** */
  }
  type IntermediateCatchEventAttr = {
    eventDefinitionRefs?: string,
  } & NodeElementAttr
  type IntermediateCatchEvent = {
    '#attr'?: IntermediateCatchEventAttr,
    incoming?: string | string[], /** */
    timerEventDefinition?: string | TimerEventDefinition[], /** */
    linkEventDefinition?: string | LinkEventDefinition[], /** */
  }

  type EventDefinitionAttr = { } & BaseElementAttr
  type EventDefinition = {
    '#attr'?: EventDefinitionAttr,
  }
  type TimerEventDefinitionAttr = {
  } & EventDefinitionAttr
  type TimerEventDefinition = {
    '#attr'?: TimerEventDefinitionAttr,
    timeDuration?: string | ConditionExpression[],
    timeDate?: string | ConditionExpression[],
    timeCycle?: string | ConditionExpression[],
  }
  type ConditionalEventDefinitionAttr = {
  } & EventDefinitionAttr
  type ConditionalEventDefinition = {
    '#attr'?: ConditionalEventDefinitionAttr,
    condition?: string | ConditionExpression[],
  }
  type ErrorEventDefinitionAttr = {
    errorRef?: string,
  } & EventDefinitionAttr
  type ErrorEventDefinition = {
    '#attr'?: ErrorEventDefinitionAttr,
  }
  type MessageEventDefinitionAttr = {
    messageRef?: string,
  } & EventDefinitionAttr
  type MessageEventDefinition = {
    '#attr'?: MessageEventDefinitionAttr,
  }
  type SignalEventDefinitionAttr = {
    signalRef?: string,
  } & EventDefinitionAttr
  type SignalEventDefinition = {
    '#attr'?: SignalEventDefinitionAttr,
  }
  type LinkEventDefinitionAttr = {
  } & EventDefinitionAttr
  type LinkEventDefinition = {
    '#attr'?: LinkEventDefinitionAttr,
  }
  type TerminateEventDefinitionAttr = {
  } & EventDefinitionAttr
  type TerminateEventDefinition = {
    '#attr'?: TerminateEventDefinitionAttr,
  }

  type GatewayAttr = {
    gatewayDirections?: string,
    default?: string,
  } & NodeElementAttr
  type Gateway = {
    '#attr'?: GatewayAttr,
    outgoing?: string | string[], /** */
    incoming?: string | string[], /** */
  }

  type ParallelGatewayAttr = {} & GatewayAttr
  type ParallelGateway = {
    '#attr'?: ParallelGatewayAttr,
  } & Gateway

  type ExclusiveGatewayAttr = {} & GatewayAttr
  type ExclusiveGateway = {
    '#attr'?: ExclusiveGatewayAttr,
  } & Gateway

  type InclusiveGatewayAttr = {} & GatewayAttr
  type InclusiveGateway = {
    '#attr'?: InclusiveGatewayAttr,
  } & Gateway


  type LaneSetAttr = {} & BaseElementAttr
  type LaneSet = {
    '#attr'?: LaneSetAttr,
    lane?: Lane[],
  }
  type LaneAttr = {} & BaseElementAttr
  type Lane = {
    '#attr'?: LaneAttr,
    flowNodeRef?: string | string[],
  }

  type CollaborationAttr = {} & BaseElementAttr
  type Collaboration = {
    '#attr'?: CollaborationAttr,
    participant?: Participant[],
  }
  type ParticipantAttr = {
    processRef?: string,
  } & BaseElementAttr
  type Participant = {
    '#attr'?: ParticipantAttr,
  }
} // end namespace
