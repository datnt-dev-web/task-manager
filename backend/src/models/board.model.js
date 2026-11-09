module.exports = (sequelize, DataTypes) => {
  const Board = sequelize.define(
    'Board',
    {
      id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
      projectId: { type: DataTypes.UUID, allowNull: false },
      name: { type: DataTypes.STRING(100), allowNull: false },
    },
    { tableName: 'boards' },
  );

  Board.associate = (models) => {
    Board.belongsTo(models.Project, { foreignKey: 'projectId', as: 'project' });
    Board.hasMany(models.BoardColumn, { foreignKey: 'boardId', as: 'columns' });
  };

  return Board;
};
