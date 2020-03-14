
/** Nazvy pro podporovane implementace uzlu */
export enum SupportedNode {
  Task = 'Task',
  ScriptTask = 'ScriptTask',

  StartEvent = 'StartEvent',

  EndEvent = 'EndEvent',

  IntermediateThrowEvent = 'IntermediateThrowEvent',

  IntermediateCatchEvent = 'IntermediateCatchEvent',

  ParallelGateway = 'ParallelGateway',
  InclusiveGateway = 'InclusiveGateway',
  ExclusiveGateway = 'ExclusiveGateway',

}
