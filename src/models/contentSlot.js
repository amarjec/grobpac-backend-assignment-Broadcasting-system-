const { DataTypes } = require('sequelize')

module.exports = (sequelize) => {
  const ContentSlot = sequelize.define(
    'ContentSlot',
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
      },
      subject: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
      }
    },
    {
      tableName: 'content_slots',
      timestamps: false
    }
  )

  return ContentSlot
}
