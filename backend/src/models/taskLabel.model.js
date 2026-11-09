module.exports = (sequelize, DataTypes) =>
  sequelize.define(
    'TaskLabel',
    {
      taskId: { type: DataTypes.UUID, primaryKey: true },
      labelId: { type: DataTypes.UUID, primaryKey: true },
    },
    { tableName: 'task_labels', timestamps: false },
  );
