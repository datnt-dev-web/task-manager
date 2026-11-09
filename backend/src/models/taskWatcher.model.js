module.exports = (sequelize, DataTypes) =>
  sequelize.define(
    'TaskWatcher',
    {
      taskId: { type: DataTypes.UUID, primaryKey: true },
      userId: { type: DataTypes.UUID, primaryKey: true },
    },
    { tableName: 'task_watchers', updatedAt: false },
  );
