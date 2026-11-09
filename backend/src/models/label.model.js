module.exports = (sequelize, DataTypes) => {
  const Label = sequelize.define(
    'Label',
    {
      id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
      projectId: { type: DataTypes.UUID, allowNull: false },
      name: { type: DataTypes.STRING(50), allowNull: false },
      color: { type: DataTypes.STRING(16), allowNull: false },
    },
    { tableName: 'labels' },
  );

  Label.associate = (models) => {
    Label.belongsTo(models.Project, { foreignKey: 'projectId', as: 'project' });
    Label.belongsToMany(models.Task, { through: models.TaskLabel, foreignKey: 'labelId', otherKey: 'taskId', as: 'tasks' });
  };

  return Label;
};
