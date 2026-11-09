// Dùng chung cho ứng dụng và sequelize-cli (migration, seeder).
const path = require('node:path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env'), quiet: true });

const common = {
  url: process.env.DATABASE_URL,
  dialect: 'postgres',
  logging: false,
  define: { underscored: true },
  migrationStorageTableName: 'sequelize_meta',
  seederStorage: 'sequelize',
  seederStorageTableName: 'sequelize_seeds',
};

module.exports = {
  development: common,
  test: common,
  production: common,
};
