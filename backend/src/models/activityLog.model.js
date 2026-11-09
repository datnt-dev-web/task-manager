module.exports = (sequelize, DataTypes) => {
  const ActivityLog = sequelize.define(
    'ActivityLog',
    {
      id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
      projectId: { type: DataTypes.UUID, allowNull: false },
      taskId: { type: DataTypes.UUID },
      actorId: { type: DataTypes.UUID },
      action: { type: DataTypes.STRING(40), allowNull: false },
      field: { type: DataTypes.STRING(40) },
      oldValue: { type: DataTypes.TEXT },
      newValue: { type: DataTypes.TEXT },
    },
    { tableName: 'activity_logs', updatedAt: false },
  );

  ActivityLog.associate = (models) => {
    ActivityLog.belongsTo(models.User, { foreignKey: 'actorId', as: 'actor' });
    ActivityLog.belongsTo(models.Task, { foreignKey: 'taskId', as: 'task' });
  };

  return ActivityLog;
};
