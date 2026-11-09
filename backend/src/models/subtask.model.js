module.exports = (sequelize, DataTypes) => {
  const Subtask = sequelize.define(
    'Subtask',
    {
      id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
      taskId: { type: DataTypes.UUID, allowNull: false },
      title: { type: DataTypes.STRING(255), allowNull: false },
      isDone: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
      assigneeId: { type: DataTypes.UUID },
      dueDate: { type: DataTypes.DATEONLY },
      position: { type: DataTypes.DOUBLE, allowNull: false },
    },
    { tableName: 'subtasks' },
  );

  Subtask.associate = (models) => {
    Subtask.belongsTo(models.Task, { foreignKey: 'taskId', as: 'task' });
    Subtask.belongsTo(models.User, { foreignKey: 'assigneeId', as: 'assignee' });
  };

  return Subtask;
};
