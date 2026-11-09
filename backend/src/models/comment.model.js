module.exports = (sequelize, DataTypes) => {
  const Comment = sequelize.define(
    'Comment',
    {
      id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
      taskId: { type: DataTypes.UUID, allowNull: false },
      authorId: { type: DataTypes.UUID, allowNull: false },
      body: { type: DataTypes.JSONB, allowNull: false },
      bodyText: { type: DataTypes.TEXT },
      editedAt: { type: DataTypes.DATE },
    },
    { tableName: 'comments', paranoid: true },
  );

  Comment.prototype.toJSON = function toJSON() {
    const values = { ...this.get() };
    delete values.deletedAt;
    delete values.bodyText;
    return values;
  };

  Comment.associate = (models) => {
    Comment.belongsTo(models.Task, { foreignKey: 'taskId', as: 'task' });
    Comment.belongsTo(models.User, { foreignKey: 'authorId', as: 'author' });
  };

  return Comment;
};
