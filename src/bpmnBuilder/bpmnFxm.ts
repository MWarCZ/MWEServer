
export declare namespace BpmnFxm {
  /** XML Elements */

  type BaseElementAttr = {
    id?: string,
    name?: string,
  }

  type DefinitionsAttr = {
    [key: string]: string,
    targetNamespace: string,
  } & BaseElementAttr
  type Definitions = {
    '#attr'?: DefinitionsAttr,
    process?: Process[],
    collaboration?: {}[],
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
    // sequence
    sequenceFlow?: SequenceFlow[],
    // data
    dataObject?: DataObject[],
    dataObjectReference?: DataObjectReference[],
    // events
    startEvent?: StartEvent[],
    endEvent?: EndEvent[],
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


  type TaskAttr = {} & BaseElementAttr
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
  } & BaseElementAttr
  type ScriptTask = {
    '#attr'?: ScriptTaskAttr,
    script?: string,
  } & Task

  type ServiceTaskAttr = {
    implementation?: string,
  } & BaseElementAttr
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
  } & BaseElementAttr
  type StartEvent = {
    '#attr'?: StartEventAttr,
    outgoing?: string | string[], /** */
    conditionalEventDefinition?: string, /** */
    timerEventDefinition?: string, /** */
    linkEventDefinition?: string, /** */
    messageEventDefinition?: string, /** */
    errorEventDefinition?: string, /** */
    signalEventDefinition?: string, /** */
  }

  type EndEventAttr = {
    eventDefinitionRefs?: string,
  } & BaseElementAttr
  type EndEvent = {
    '#attr'?: EndEventAttr,
    incoming?: string | string[], /** */
    linkEventDefinition?: string, /** */
    messageEventDefinition?: string, /** */
    errorEventDefinition?: string, /** */
    signalEventDefinition?: string, /** */
  }


  type GatewayAttr = {
    gatewayDirections?: string,
    default?: string,
  } & BaseElementAttr
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
    lane?: Lane[],
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
