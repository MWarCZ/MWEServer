///////////////////////////////////////
// Soubor: src/utils/db.ts
// Projekt: MWEServer
// Autor: Miroslav Válka
///////////////////////////////////////
import * as fs from 'fs'
import { join as pathJoin } from 'path'
import { Connection, createConnection, EntityMetadata, getConnection, getConnectionOptions } from 'typeorm'

/** Vytvoreni pripojeni k databazi */
export async function createConn(): Promise<Connection> {
  let opt = await getConnectionOptions()
  let conn = await createConnection(opt)
  return conn
}

/** Zavreni pripojeni k databazi */
export async function closeConn(connection?: Connection): Promise<void> {
  let conn = (!!connection) ? connection : getConnection()
  if (conn.isConnected) {
    await conn.close()
  }
  // const conn = (await connection);
  // if (conn.isConnected) {
  //   await (await connection).close();
  // }
}

/** Vycisteni dat v databazi */
export async function cleanDataInTables(connection: Connection, entities: EntityMetadata[]) {
  let sql = ''
  try {
    for (const entity of entities) {
      const repository = await connection.getRepository(entity.name)
      // await repository.query(`TRUNCATE TABLE \`${entity.tableName}\`;`);
      sql = `DELETE FROM \`${entity.tableName}\`;`
      await repository.query(`DELETE FROM \`${entity.tableName}\`;`)
    }
  } catch (error) {
    throw new Error(`ERROR: Cleaning data in test db:\n sql: ${sql} \n${error}`)
  }
}
/** Nacteni dat do databaze */
export function loadDataToDb(connection: Connection, entities: Function[], pathFolder: string) {
  let metadatas = entities.map(e => connection.getMetadata(e))
  return loadDataToTables(connection, metadatas, pathFolder)
}
/** Nacteni dat do databaze ze souboru *.json */
export async function loadDataToTables(connection: Connection, entities: EntityMetadata[], pathFolder: string) {
  try {
    for (const entity of entities) {
      const repository = await connection.getRepository(entity.name)
      const path = pathJoin(pathFolder, `${entity.tableName}.json`)

      if (fs.existsSync(path)) {
        const items = JSON.parse(fs.readFileSync(path, 'utf8'))

        if (typeof items === 'object' && (items as any[]).length > 0) {
          await repository
            .createQueryBuilder(entity.name)
            .insert()
            .values(items)
            .execute()
        }
      }

    }
  } catch (error) {
    throw new Error(`ERROR: Loading data to test db: ${error}`)
  }
}
