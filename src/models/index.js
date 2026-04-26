const { Sequelize } = require('sequelize')

const databaseUrl = process.env.DATABASE_URL

const sequelize = databaseUrl
  ? new Sequelize(databaseUrl, {
      dialect: 'postgres',
      logging: false,
      dialectOptions: {
        ssl: {
          require: true,
          rejectUnauthorized: false
        }
      }
    })
  : new Sequelize(
      process.env.DB_NAME || 'content_broadcasting_system',
      process.env.DB_USER || 'postgres',
      process.env.DB_PASSWORD || 'postgres',
      {
        host: process.env.DB_HOST || 'localhost',
        port: Number(process.env.DB_PORT || 5432),
        dialect: 'postgres',
        logging: false
      }
    )

const db = {}

db.sequelize = sequelize
db.Sequelize = Sequelize
db.User = require('./user')(sequelize)
db.Content = require('./content')(sequelize)
db.ContentSlot = require('./contentSlot')(sequelize)
db.ContentSchedule = require('./contentSchedule')(sequelize)

db.User.hasMany(db.Content, {
  foreignKey: 'uploaded_by',
  as: 'uploadedContent'
})

db.Content.belongsTo(db.User, {
  foreignKey: 'uploaded_by',
  as: 'uploader'
})

db.User.hasMany(db.Content, {
  foreignKey: 'approved_by',
  as: 'approvedContent'
})

db.Content.belongsTo(db.User, {
  foreignKey: 'approved_by',
  as: 'approver'
})

db.ContentSlot.hasMany(db.ContentSchedule, {
  foreignKey: 'slot_id',
  as: 'schedules'
})

db.ContentSchedule.belongsTo(db.ContentSlot, {
  foreignKey: 'slot_id',
  as: 'slot'
})

db.Content.hasOne(db.ContentSchedule, {
  foreignKey: 'content_id',
  as: 'schedule'
})

db.ContentSchedule.belongsTo(db.Content, {
  foreignKey: 'content_id',
  as: 'content'
})

module.exports = db