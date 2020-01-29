import * as fs from 'fs'
import { join as pathJoin } from 'path'
import { Connection, createConnection, EntityMetadata, getConnection } from 'typeorm'

export async function createConn(): Promise<Connection> {
  let conn = await createConnection({
    type: 'mysql',
    host: 'localhost',
    port: 3306,
    username: 'root',
    password: 'root',
    database: 'mwe',
    synchronize: true,
    entities: [
      pathJoin(__dirname, '../entity/**/*.ts'),
    ],
  })
  return conn
}

export async function closeConn(connection?: Connection): Promise<void> {
  let conn = (!!connection) ? connection : getConnection()
  if (conn.isConnected) {
    await conn.close()
  }
  conn.entityMetadatas[0].name
  // const conn = (await connection);
  // if (conn.isConnected) {
  //   await (await connection).close();
  // }
}

export async function cleanDataInTables(connection: Connection, entities: EntityMetadata[]) {
  try {
    for (const entity of entities) {
      const repository = await connection.getRepository(entity.name)
      // await repository.query(`TRUNCATE TABLE \`${entity.tableName}\`;`);
      await repository.query(`DELETE FROM \`${entity.tableName}\`;`)
    }
  } catch (error) {
    throw new Error(`ERROR: Cleaning data in test db: ${error}`)
  }
}

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
