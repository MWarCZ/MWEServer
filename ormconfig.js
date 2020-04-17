const shared = {
  "type": "mysql",
  "host": "localhost",
  "port": 3306,
  "username": "root",
  "password": "root",
  "database": "mwe",
}
if(process.env.NODE_ENV === 'ts') {
  module.exports = {
    ...shared,
    "synchronize": true,
    "logging": false,
    "entities": [
      "src/entity/**/*.ts"
    ],
    "migrations": [
      "src/migration/**/*.ts"
    ],
    "subscribers": [
      "src/subscriber/**/*.ts"
    ],
    "cli": {
      "entitiesDir": "src/entity",
      "migrationsDir": "src/migration",
      "subscribersDir": "src/subscriber"
    }
  }
} else {
  module.exports = {
    ...shared,
    "synchronize": false,
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
}
