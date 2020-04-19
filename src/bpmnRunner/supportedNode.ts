
/** Nazvy pro podporovane implementace uzlu */
export enum SupportedNode {
  Task = 'Task',
  ScriptTask = 'ScriptTask',

  StartEvent = 'StartEvent',

  EndEvent = 'EndEvent',
  TerminateEndEvent = 'TerminateEndEvent',

  IntermediateThrowEvent = 'IntermediateThrowEvent',
  LinkIntermediateThrowEvent = 'LinkIntermediateThrowEvent',
  // linkEventDefinition
  // messageEventDefinition
  // signalEventDefinition

  IntermediateCatchEvent = 'IntermediateCatchEvent',
  LinkIntermediateCatchEvent = 'LinkIntermediateCatchEvent',
  TimerIntermediateCatchEvent = 'TimerIntermediateCatchEvent',
  // timerEventDefinition
  // linkEventDefinition
  // messageEventDefinition
  // signalEventDefinition

  ParallelGateway = 'ParallelGateway',
  InclusiveGateway = 'InclusiveGateway',
  ExclusiveGateway = 'ExclusiveGateway',

  // ================

  UserTask = 'UserTask',
  ManualTask = 'ManualTask',
  // receiveTask
  // sendTask
  // serviceTask
  // businessRuleTask
}
