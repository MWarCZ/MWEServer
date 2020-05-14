///////////////////////////////////////
// Soubor: src/bpmnRunner/anotherhelpers.ts
// Projekt: MWEServer
// Autor: Miroslav Válka
///////////////////////////////////////
import { Connection } from 'typeorm'

import { BaseElementInstance, BaseElementTemplate } from '../entity/bpmn'
import { Constructor } from '../types/constructor'

//#region Pomocne funkce k ziskani sablony z sablony ci id_sablony.

/** Pomocna funkce pro ziskani entit sablon, ktera omezi duplicitni nacitani z databaze.  */
export async function getTemplate<T extends BaseElementTemplate>(
  options: {
    typeormConnection: Connection,
    templateClass: Constructor<T>,
    entityOrId: { id: number } | T,
    relations?: string[],
  },
): Promise<T> {
  const { typeormConnection, templateClass, entityOrId, relations } = options
  if (entityOrId instanceof templateClass && !relations) {
    return entityOrId
  }
  let res = await typeormConnection.getRepository(templateClass).findOne(entityOrId.id, { relations })
  if (!res) {
    throw new Error(`Sablona '${templateClass.name}(${entityOrId.id})' nenalezena.`)
  }
  return res
}
/** Pomocna funkce pro ziskani entit instanci, ktera omezi duplicitni nacitani z databaze.  */
export async function getInstance<T extends BaseElementInstance>(
  options: {
    typeormConnection: Connection,
    instanceClass: Constructor<T>,
    entityOrId: { id: number } | T,
  },
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
