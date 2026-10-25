import { DataTypes } from 'sequelize'
import { sequelize } from '../db.js'

export const UserRole = sequelize.define('UserRole', {
  role: DataTypes.STRING,
}, { tableName: 'user_role', timestamps: false })
