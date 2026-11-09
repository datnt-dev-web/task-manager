const TASK_TYPES = ['task', 'bug'];
// Thứ tự khai báo = thứ tự sắp xếp tăng dần trong PostgreSQL (khẩn cấp lên đầu).
const TASK_PRIORITIES = ['urgent', 'high', 'medium', 'low'];

module.exports = (sequelize, DataTypes) => {
  const Task = sequelize.define(
    'Task',
    {
      id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
      projectId: { type: DataTypes.UUID, allowNull: false },
      number: { type: DataTypes.INTEGER, allowNull: false },
      key: { type: DataTypes.STRING(20), allowNull: false, unique: true },
      type: { type: DataTypes.ENUM(...TASK_TYPES), allowNull: false, defaultValue: 'task' },
      title: { type: DataTypes.STRING(255), allowNull: false },
      description: { type: DataTypes.JSONB },
      descriptionText: { type: DataTypes.TEXT },
      columnId: { type: DataTypes.UUID, allowNull: false },
      assigneeId: { type: DataTypes.UUID },
      creatorId: { type: DataTypes.UUID, allowNull: false },
      priority: { type: DataTypes.ENUM(...TASK_PRIORITIES), allowNull: false, defaultValue: 'medium' },
      dueDate: { type: DataTypes.DATEONLY },
      position: { type: DataTypes.DOUBLE, allowNull: false },
      completedAt: { type: DataTypes.DATE },
      sprintId: { type: DataTypes.UUID },
      // Thứ tự ưu tiên trong backlog/sprint (độc lập với thứ tự trên bảng)
      backlogRank: { type: DataTypes.DOUBLE, allowNull: false, defaultValue: 0 },
    },
    { tableName: 'tasks', paranoid: true },
  );

  Task.prototype.toJSON = function toJSON() {
    const values = { ...this.get() };
    delete values.deletedAt;
    delete values.descriptionText;
    return values;
  };

  Task.associate = (models) => {
    Task.belongsTo(models.Project, { foreignKey: 'projectId', as: 'project' });
    Task.belongsTo(models.BoardColumn, { foreignKey: 'columnId', as: 'column' });
    Task.belongsTo(models.User, { foreignKey: 'assigneeId', as: 'assignee' });
    Task.belongsTo(models.User, { foreignKey: 'creatorId', as: 'creator' });
    Task.belongsToMany(models.Label, { through: models.TaskLabel, foreignKey: 'taskId', otherKey: 'labelId', as: 'labels' });
    Task.hasMany(models.Comment, { foreignKey: 'taskId', as: 'comments' });
    Task.hasMany(models.Subtask, { foreignKey: 'taskId', as: 'subtasks' });
    Task.hasMany(models.Attachment, { foreignKey: 'taskId', as: 'attachments' });
    Task.hasMany(models.TaskWatcher, { foreignKey: 'taskId', as: 'watchers' });
    Task.belongsTo(models.Sprint, { foreignKey: 'sprintId', as: 'sprint' });
  };

  return Task;
};

module.exports.TASK_TYPES = TASK_TYPES;
module.exports.TASK_PRIORITIES = TASK_PRIORITIES;
