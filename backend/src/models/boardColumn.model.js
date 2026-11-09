module.exports = (sequelize, DataTypes) => {
  const BoardColumn = sequelize.define(
    'BoardColumn',
    {
      id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
      boardId: { type: DataTypes.UUID, allowNull: false },
      name: { type: DataTypes.STRING(30), allowNull: false },
      position: { type: DataTypes.INTEGER, allowNull: false },
      isDone: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    },
    { tableName: 'board_columns' },
  );

  BoardColumn.associate = (models) => {
    BoardColumn.belongsTo(models.Board, { foreignKey: 'boardId', as: 'board' });
    BoardColumn.hasMany(models.Task, { foreignKey: 'columnId', as: 'tasks' });
  };

  return BoardColumn;
};
