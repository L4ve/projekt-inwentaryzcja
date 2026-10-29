import { DataTypes } from 'sequelize'
import { sequelize } from '../db.js'

export const Item = sequelize.define(
  'Item',
  {
    inventory_number: DataTypes.STRING,
    manufacturer: DataTypes.STRING,
    model: DataTypes.STRING,
    purchase_date: DataTypes.DATEONLY,
    purchase_price: DataTypes.DECIMAL(10, 2),
    location_id: DataTypes.INTEGER,
    status_id: DataTypes.INTEGER,
    assigned_to: DataTypes.INTEGER,
  },
  { tableName: 'item', timestamps: false }
)
