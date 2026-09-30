import express from 'express'
import cors from 'cors'
import { Sequelize, DataTypes } from 'sequelize'
import dotenv from 'dotenv'

dotenv.config({ path: new URL('.env', import.meta.url) })

const sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASSWORD, {
  host: process.env.DB_HOST,
  dialect: 'mysql',
  logging: false, // chuj wie co to robi ale potrzebne do orm
})

const Item = sequelize.define(
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

const app = express()
app.use(cors())
app.use(express.json())

app.get('/api/items', async (req, res) => {
  try {
    const items = await Item.findAll()
    res.json(items)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.get('/api/items/:id', async (req, res) => {
  try {
    const item = await Item.findByPk(req.params.id)
    if (!item) {
      return res.status(404).json({ error: 'Item not found' })
    }

    res.json(item)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.post('/api/items', async (req, res) => {
  try {
    const { inventory_number, manufacturer, model } = req.body
    const item = await Item.create({ inventory_number, manufacturer, model })
    res.json({ id: item.id })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.put('/api/items/:id', async (req, res) => {
  try {
    const item = await Item.findByPk(req.params.id)
    if (!item) {
      return res.status(404).json({ error: 'Item not found' })
    }

    const { inventory_number, manufacturer, model, purchase_date, purchase_price, location_id, status_id, assigned_to } = req.body
    await item.update({
      inventory_number,
      manufacturer,
      model,
      purchase_date,
      purchase_price,
      location_id,
      status_id,
      assigned_to,
    })

    res.json({ message: 'Item updated' })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.delete('/api/items/:id', async (req, res) => {
  try {
    const item = await Item.findByPk(req.params.id)
    if (!item) {
      return res.status(404).json({ error: 'Item not found' })
    }

    await item.destroy()
    res.json({ message: 'Item deleted' })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.listen(4000, () => {
  console.log('ale mi dryga api dziala oh ahhhh oh ahhhh http://localhost:4000')
})