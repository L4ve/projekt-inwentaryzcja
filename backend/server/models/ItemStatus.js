import { DataTypes } from 'sequelize'
import { sequelize } from '../db.js'

export const ItemStatus = sequelize.define('ItemStatus', {
  name: DataTypes.STRING,
}, { tableName: 'item_status', timestamps: false })
