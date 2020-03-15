module.exports = {
  "type": "mysql",
  "host": "localhost",
  "port": 3306,
  "username": "root",
  "password": "root",
  "database": "mwe",
  "synchronize": true,
  "logging": false,
  "entities": [
    "dist/entity/**/*.js"
  ],
  "migrations": [
    "dist/migration/**/*.js"
  ],
  "subscribers": [
    "dist/subscriber/**/*.js"
  ],
  "cli": {
    "entitiesDir": "dist/entity",
    "migrationsDir": "dist/migration",
    "subscribersDir": "dist/subscriber"
  }
}
