const NOTIFICATION_TYPES = [
  'task_assigned',
  'mentioned',
  'comment_added',
  'status_changed',
  'added_to_project',
  'due_soon',
  'overdue',
  'task_returned',
];

module.exports = (sequelize, DataTypes) => {
  const Notification = sequelize.define(
    'Notification',
    {
      id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
      userId: { type: DataTypes.UUID, allowNull: false },
      type: { type: DataTypes.ENUM(...NOTIFICATION_TYPES), allowNull: false },
      actorId: { type: DataTypes.UUID },
      projectId: { type: DataTypes.UUID },
      taskId: { type: DataTypes.UUID },
      data: { type: DataTypes.JSONB, allowNull: false, defaultValue: {} },
      readAt: { type: DataTypes.DATE },
    },
    { tableName: 'notifications', updatedAt: false },
  );

  Notification.associate = (models) => {
    Notification.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
    Notification.belongsTo(models.User, { foreignKey: 'actorId', as: 'actor' });
    Notification.belongsTo(models.Project, { foreignKey: 'projectId', as: 'project' });
    Notification.belongsTo(models.Task, { foreignKey: 'taskId', as: 'task' });
  };

  return Notification;
};

module.exports.NOTIFICATION_TYPES = NOTIFICATION_TYPES;
