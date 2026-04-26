const { DataTypes } = require('sequelize')

module.exports = (sequelize) => {
  const ContentSchedule = sequelize.define(
    'ContentSchedule',
    {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
      },
      content_id: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      slot_id: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      rotation_order: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      duration: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      start_time: {
        type: DataTypes.DATE,
        allowNull: true
      },
      end_time: {
        type: DataTypes.DATE,
        allowNull: true
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW
      }
    },
    {
      tableName: 'content_schedule',
      timestamps: false
    }
  )

  return ContentSchedule
}
