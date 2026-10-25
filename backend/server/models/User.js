import { DataTypes } from 'sequelize'
import { sequelize } from '../db.js'

export const User = sequelize.define('User', {
  email: { type: DataTypes.STRING(254), unique: true },
  password_hash: DataTypes.STRING,
  role_id: DataTypes.INTEGER,
}, { tableName: 'user', timestamps: false })
