import { DataTypes } from 'sequelize'
import { sequelize } from '../db.js'

export const Session = sequelize.define('Session', {
  token_hash: { type: DataTypes.STRING(64), primaryKey: true },
  user_id: DataTypes.INTEGER,
  expires_at: DataTypes.DATE,
}, { tableName: 'auth_session', timestamps: false })
