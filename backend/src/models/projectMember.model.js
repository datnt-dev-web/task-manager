const PROJECT_ROLES = ['manager', 'member', 'viewer'];

module.exports = (sequelize, DataTypes) => {
  const ProjectMember = sequelize.define(
    'ProjectMember',
    {
      projectId: { type: DataTypes.UUID, primaryKey: true },
      userId: { type: DataTypes.UUID, primaryKey: true },
      role: { type: DataTypes.ENUM(...PROJECT_ROLES), allowNull: false, defaultValue: 'member' },
    },
    { tableName: 'project_members' },
  );

  ProjectMember.associate = (models) => {
    ProjectMember.belongsTo(models.Project, { foreignKey: 'projectId', as: 'project' });
    ProjectMember.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
  };

  return ProjectMember;
};

module.exports.PROJECT_ROLES = PROJECT_ROLES;
