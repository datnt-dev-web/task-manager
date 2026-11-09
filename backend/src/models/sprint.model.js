const SPRINT_STATES = ['planned', 'active', 'completed'];

module.exports = (sequelize, DataTypes) => {
  const Sprint = sequelize.define(
    'Sprint',
    {
      id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
      projectId: { type: DataTypes.UUID, allowNull: false },
      name: { type: DataTypes.STRING(100), allowNull: false },
      goal: { type: DataTypes.TEXT },
      startDate: { type: DataTypes.DATEONLY },
      endDate: { type: DataTypes.DATEONLY },
      state: { type: DataTypes.ENUM(...SPRINT_STATES), allowNull: false, defaultValue: 'planned' },
      position: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
      completedAt: { type: DataTypes.DATE },
    },
    { tableName: 'sprints' },
  );

  Sprint.associate = (models) => {
    Sprint.belongsTo(models.Project, { foreignKey: 'projectId', as: 'project' });
    Sprint.hasMany(models.Task, { foreignKey: 'sprintId', as: 'tasks' });
  };

  return Sprint;
};

module.exports.SPRINT_STATES = SPRINT_STATES;
