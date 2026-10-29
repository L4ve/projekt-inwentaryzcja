import { DataTypes } from 'sequelize'
import { sequelize } from '../db.js'

export const Location = sequelize.define('Location', {
  building: DataTypes.STRING,
  room: DataTypes.STRING,
}, { tableName: 'location', timestamps: false })
