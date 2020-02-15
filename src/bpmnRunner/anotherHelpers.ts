import { Connection } from 'typeorm'

import { BaseElementInstance, BaseElementTemplate } from '../entity/bpmn'
import { ObjectType } from '../types/objectType'

//#region Pomocne funkce k ziskani sablony z sablony ci id_sablony.

export async function getTemplate<T extends BaseElementTemplate>(
  options: {
    typeormConnection: Connection,
    templateClass: ObjectType<T>,
    entityOrId: { id: number } | T,
  }
): Promise<T> {
  const { typeormConnection, templateClass, entityOrId } = options
  if (entityOrId instanceof templateClass) {
    return entityOrId
  }
  let res = await typeormConnection.getRepository(templateClass).findOne(entityOrId.id)
  if (!res) {
    throw new Error(`Sablona '${templateClass.name}(${entityOrId.id})' nenalezena.`)
  }
  return res
}

export async function getInstance<T extends BaseElementInstance>(
  options: {
    typeormConnection: Connection,
    instanceClass: ObjectType<T>,
    entityOrId: { id: number } | T,
  }
): Promise<T> {
  const { typeormConnection, instanceClass, entityOrId } = options
  if (entityOrId instanceof instanceClass) {
    return entityOrId
  }
  let res = await typeormConnection.getRepository(instanceClass).findOne(entityOrId.id)
  if (!res) {
    throw new Error(`Instance '${instanceClass.name}(${entityOrId.id})' nenalezena.`)
  }
  return res
}

  //#endregion