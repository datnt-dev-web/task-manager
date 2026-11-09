module.exports = (sequelize, DataTypes) => {
  const Project = sequelize.define(
    'Project',
    {
      id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
      key: { type: DataTypes.STRING(6), allowNull: false, unique: true },
      name: { type: DataTypes.STRING(120), allowNull: false },
      description: { type: DataTypes.JSONB },
      icon: { type: DataTypes.STRING(32) },
      color: { type: DataTypes.STRING(16) },
      createdById: { type: DataTypes.UUID, allowNull: false },
      taskCounter: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
      sprintCounter: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
      archivedAt: { type: DataTypes.DATE },
    },
    { tableName: 'projects', paranoid: true },
  );

  Project.prototype.toJSON = function toJSON() {
    const values = { ...this.get() };
    delete values.taskCounter;
    delete values.sprintCounter;
    delete values.deletedAt;
    return values;
  };

  Project.associate = (models) => {
    Project.belongsTo(models.User, { foreignKey: 'createdById', as: 'createdBy' });
    Project.hasMany(models.ProjectMember, { foreignKey: 'projectId', as: 'members' });
    Project.hasOne(models.Board, { foreignKey: 'projectId', as: 'board' });
    Project.hasMany(models.Task, { foreignKey: 'projectId', as: 'tasks' });
    Project.hasMany(models.Label, { foreignKey: 'projectId', as: 'labels' });
    Project.hasMany(models.Sprint, { foreignKey: 'projectId', as: 'sprints' });
  };

  return Project;
};
