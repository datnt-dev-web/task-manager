module.exports = (sequelize, DataTypes) => {
  const Attachment = sequelize.define(
    'Attachment',
    {
      id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
      taskId: { type: DataTypes.UUID, allowNull: false },
      uploadedById: { type: DataTypes.UUID, allowNull: false },
      fileName: { type: DataTypes.STRING(255), allowNull: false },
      mimeType: { type: DataTypes.STRING(120), allowNull: false },
      size: { type: DataTypes.INTEGER, allowNull: false },
      storageKey: { type: DataTypes.STRING(255), allowNull: false, unique: true },
    },
    { tableName: 'attachments', updatedAt: false },
  );

  Attachment.prototype.toJSON = function toJSON() {
    const values = { ...this.get() };
    delete values.storageKey; // không lộ đường dẫn lưu trữ
    values.url = `/api/v1/attachments/${values.id}/download`;
    return values;
  };

  Attachment.associate = (models) => {
    Attachment.belongsTo(models.Task, { foreignKey: 'taskId', as: 'task' });
    Attachment.belongsTo(models.User, { foreignKey: 'uploadedById', as: 'uploadedBy' });
  };

  return Attachment;
};
