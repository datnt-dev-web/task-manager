const { Sequelize, DataTypes } = require('sequelize');
const env = require('../config/env');
const dbConfig = require('../config/database')[env.NODE_ENV];

const sequelize = new Sequelize(dbConfig.url, {
  dialect: 'postgres',
  logging: dbConfig.logging,
  define: dbConfig.define,
});

// Thêm model mới: tạo file *.model.js rồi khai báo ở đây.
const definitions = [
  require('./user.model'),
  require('./refreshToken.model'),
  require('./project.model'),
  require('./projectMember.model'),
  require('./board.model'),
  require('./boardColumn.model'),
  require('./label.model'),
  require('./task.model'),
  require('./taskLabel.model'),
  require('./comment.model'),
  require('./subtask.model'),
  require('./taskWatcher.model'),
  require('./attachment.model'),
  require('./notification.model'),
  require('./activityLog.model'),
  require('./sprint.model'),
];

const models = {};
for (const define of definitions) {
  const model = define(sequelize, DataTypes);
  models[model.name] = model;
}
for (const model of Object.values(models)) {
  if (typeof model.associate === 'function') model.associate(models);
}

module.exports = { sequelize, Sequelize, ...models };
