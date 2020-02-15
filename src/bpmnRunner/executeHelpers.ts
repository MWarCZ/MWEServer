import { taskImplementation } from '../bpmnRunnerPlugins/task'
import { ActivityStatus, BasicTaskInstance } from '../entity/bpmn'
import { NodeImplementation } from './pluginNodeImplementation'
import { RunContext } from './runContext'


export function executeBasicTaskPrerun(options: {
  taskInstance: BasicTaskInstance,
  taskImplementation: NodeImplementation,
  taskConstext: RunContext,
  taskArgs: any,
}): boolean {
  const {
    taskInstance,
    taskImplementation,
    taskConstext,
    taskArgs,
  } = options
  // status === Ready
  try {
    let result = taskImplementation.prerun ? taskImplementation.prerun({
      context: taskConstext,
      args: taskArgs,
      initNext: ()=>{},
    }) : true
    taskInstance.returnValue = result
    taskInstance.status = ActivityStatus.Active
    // status === Active
    return true
  } catch (e) {
    if (e instanceof Error) {
      taskInstance.returnValue = { error: { name: e.name, message: e.message } }
    } else {
      throw e
    }
    // status === Ready
    return false
  }
}

export function executeBasicTaskRun(options: {
  taskInstance: BasicTaskInstance,
  taskImplementation: NodeImplementation,
  taskConstext: RunContext,
  taskArgs: any,
}): boolean {
  const {
    taskInstance,
    taskImplementation,
    taskConstext,
    taskArgs,
  } = options
  // status === Active
  try {
    let result = taskImplementation.run({
      context: taskConstext,
      args: taskArgs,
      initNext: () => { },
    })
    taskInstance.status = ActivityStatus.Compensating
    taskInstance.returnValue = result
    // status === Completing
    return true
  } catch (e) {
    taskInstance.status = ActivityStatus.Falling
    if (e instanceof Error) {
      taskInstance.returnValue = { error: { name: e.name, message: e.message } }
    } else {
      throw e
    }
    // status === Falling
    return false
  }

}

export function executeBasicTask(options: {
  taskInstance: BasicTaskInstance,
  taskImplementation: NodeImplementation,
  taskConstext: RunContext,
  taskArgs: any,
}) {
  const { taskInstance, taskArgs, taskImplementation, taskConstext } = options

  // taskInstance.status === Ready
  if (executeBasicTaskPrerun({
    taskInstance, taskArgs, taskConstext, taskImplementation,
  })) {
    // status === Active
    if (executeBasicTaskRun({
      taskInstance, taskArgs, taskConstext, taskImplementation,
    })) {
      // status === completing
      if (typeof taskImplementation.onCompleting === 'function') {
        // TODO - dovymislet onCompleting()
        taskImplementation.onCompleting({
          context: taskConstext,
          args: taskArgs,
          initNext: ()=>{},
        })
      }
      taskInstance.status = ActivityStatus.Completed
      // status === completed
    } else {
      // status === Failing
      if (typeof taskImplementation.onFailing === 'function') {
        // TODO - dovymislet onFailing()
        taskImplementation.onFailing({
          context: taskConstext,
          args: taskArgs,
          initNext: () => { },
        })
      }
      taskInstance.status = ActivityStatus.Failled
      // status === Failed
    }
  } else {
    // status === Ready
    taskInstance.status = ActivityStatus.Ready
    // status === Ready
  }
}
