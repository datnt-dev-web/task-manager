module.exports = (sequelize, DataTypes) => {
  const User = sequelize.define(
    'User',
    {
      id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
      email: {
        type: DataTypes.STRING(255),
        allowNull: false,
        unique: true,
        set(value) {
          this.setDataValue('email', String(value).trim().toLowerCase());
        },
      },
      googleId: { type: DataTypes.STRING(64), unique: true },
      passwordHash: { type: DataTypes.STRING(255) },
      fullName: { type: DataTypes.STRING(120) },
      avatarUrl: { type: DataTypes.STRING(1000) },
      title: { type: DataTypes.STRING(120) },
      isAdmin: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
      status: {
        type: DataTypes.ENUM('invited', 'active', 'disabled'),
        allowNull: false,
        defaultValue: 'invited',
      },
      theme: {
        type: DataTypes.ENUM('light', 'dark', 'system'),
        allowNull: false,
        defaultValue: 'system',
      },
      lastLoginAt: { type: DataTypes.DATE },
      emailSettings: {
        type: DataTypes.JSONB,
        allowNull: false,
        defaultValue: { taskAssigned: true, mentioned: true, dueSoon: true, overdue: true, addedToProject: true },
      },
    },
    { tableName: 'users' },
  );

  User.prototype.toJSON = function toJSON() {
    const values = { ...this.get() };
    delete values.passwordHash;
    delete values.googleId;
    return values;
  };

  User.associate = (models) => {
    User.hasMany(models.ProjectMember, { foreignKey: 'userId', as: 'memberships' });
    User.hasMany(models.RefreshToken, { foreignKey: 'userId', as: 'refreshTokens' });
  };

  return User;
};
