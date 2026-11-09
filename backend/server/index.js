import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import './config.js'
import { sequelize } from './db.js'
import './models/index.js'
import authRoutes from './routes/auth.js'
import usersRoutes from './routes/users.js'
import itemsRoutes from './routes/items.js'
import locationsRoutes from './routes/locations.js'

const app = express()
const PORT = process.env.PORT || 4000

app.set('trust proxy', 1)

app.use(helmet())
app.use(cors({
  origin: process.env.FRONTEND_ORIGIN || 'http://localhost:5173',
  credentials: true,
}))
app.use(express.json({ limit: '10kb' }))

// --- ROUTING ---
app.get('/api/status', (req, res) => {
  res.status(200).json({
    status: 'ok',
    message: 'API działa',
  })
})

app.use('/api/auth', authRoutes)
app.use('/api/admin', usersRoutes)
app.use('/api/items', itemsRoutes)
app.use('/api/locations', locationsRoutes)

startServer()

async function startServer() {
  try {
    await sequelize.authenticate()
    app.listen(PORT, () => {
      console.log(`API działa na porcie ${PORT}`)
    })
  } catch (err) {
    console.error('Błąd połączenia z bazą danych:', err)
    process.exit(1)
  }
}
