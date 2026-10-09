import express from 'express'
import cors from 'cors'
import { Sequelize, DataTypes } from 'sequelize'
import dotenv from 'dotenv'
import bcrypt from 'bcryptjs'
import helmet from 'helmet'
import { createHash, randomBytes } from 'node:crypto'

dotenv.config({ path: new URL('.env', import.meta.url) })

const sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASSWORD, {
  host: process.env.DB_HOST,
  dialect: 'mysql',
  logging: false,
})

const isProduction = process.env.NODE_ENV === 'production'
const authCookieName = 'inventory_session'
const loginAttempts = new Map()
const dummyPasswordHash = '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy'

// --- DEFINICJE MODELI BAZY DANYCH ---
const UserRole = sequelize.define('UserRole', {
  role: DataTypes.STRING,
}, { tableName: 'user_role', timestamps: false })

const User = sequelize.define('User', {
  password_hash: DataTypes.STRING,
  role_id: DataTypes.INTEGER,
}, { tableName: 'user', timestamps: false })

const Session = sequelize.define('Session', {
  token_hash: DataTypes.STRING,
  user_id: DataTypes.INTEGER,
  expires_at: DataTypes.DATE,
}, { tableName: 'session', timestamps: false })

const ItemStatus = sequelize.define('ItemStatus', {
  name: DataTypes.STRING,
}, { tableName: 'item_status', timestamps: false })

const Location = sequelize.define('Location', {
  building: DataTypes.STRING,
  room: DataTypes.STRING,
}, { tableName: 'location', timestamps: false })

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

// --- ASOCJACJE (POWIĄZANIA) ---
Item.belongsTo(ItemStatus, { foreignKey: 'status_id', as: 'status' })
Item.belongsTo(Location, { foreignKey: 'location_id', as: 'location' })
Item.belongsTo(User, { foreignKey: 'assigned_to', as: 'assignedUser' })
User.belongsTo(UserRole, { foreignKey: 'role_id', as: 'UserRole' })

const app = express()

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

app.post('/api/auth/login', async (req, res) => {
  const clientKey = getClientKey(req)
  if (!canAttemptLogin(clientKey)) {
    return res.status(429).json({ error: 'Zbyt wiele prób logowania. Spróbuj ponownie później.' })
  }

  const userId = Number(req.body?.userId)
  const password = typeof req.body?.password === 'string' ? req.body.password : ''

  if (!Number.isInteger(userId) || userId <= 0 || password.length < 1 || password.length > 256) {
    registerFailedAttempt(clientKey)
    return res.status(401).json({ error: 'Nieprawidłowy identyfikator lub hasło.' })
  }

  try {
    const user = await User.findByPk(userId, { 
      include: { model: UserRole, as: 'UserRole' } 
    })
    const passwordHash = user?.password_hash?.replace('$2y$', '$2b$') || dummyPasswordHash
    const passwordMatches = await bcrypt.compare(password, passwordHash)

    if (!user || !passwordMatches) {
      registerFailedAttempt(clientKey)
      return res.status(401).json({ error: 'Nieprawidłowy identyfikator lub hasło.' })
    }

    loginAttempts.delete(clientKey)
    await createSession(res, user.id)

    return res.status(200).json({
      user: {
        id: user.id,
        role: user.UserRole?.role || 'user',
      },
    })
  } catch (err) {
    console.error('LOGIN ERROR:', err)
    return res.status(500).json({
      error: 'Nie udało się zalogować.',
      details: err.message,
    })
  }
})

app.get('/api/auth/me', requireAuth, (req, res) => {
  res.status(200).json({ user: req.user })
})

app.post('/api/auth/logout', async (req, res) => {
  const sessionToken = getCookie(req, authCookieName)
  if (sessionToken) {
    await Session.destroy({ where: { token_hash: hashToken(sessionToken) } })
  }

  res.setHeader('Set-Cookie', `${authCookieName}=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0${isProduction ? '; Secure' : ''}`)
  res.status(204).send()
})

// --- ENDPOINTY DLA ITEMÓW ---

app.get('/api/items/details', requireAuth, async (req, res) => {
  try {
    const items = await Item.findAll({
      attributes: { exclude: ['location_id', 'status_id', 'assigned_to'] },
      include: [
        { model: ItemStatus, as: 'status', attributes: ['id', 'name'] },
        { model: Location, as: 'location', attributes: ['id', 'building', 'room'] },
        { model: User, as: 'assignedUser', attributes: ['id', 'role_id'] },
      ],
    })

    res.status(200).json(items)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.get('/api/items/:id', requireAuth, async (req, res) => {
  try {
    const item = await Item.findByPk(req.params.id)
    if (!item) {
      return res.status(404).json({ error: 'Item not found' })
    }

    res.status(200).json(item)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.get('/api/items', requireAuth, async (req, res) => {
  try {
    const items = await Item.findAll()
    res.status(200).json(items)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.post('/api/items', requireAuth, async (req, res) => {
  try {
    const {
      inventory_number,
      manufacturer = null,
      model = null,
      purchase_date = null,
      purchase_price = null,
      location_id = null,
      status_id = 1,
      assigned_to = null,
    } = req.body

    const validationError = validateItem({ inventory_number, purchase_price })
    if (validationError) {
      return res.status(400).json({ error: validationError })
    }

    const item = await Item.create({
      inventory_number,
      manufacturer,
      model,
      purchase_date,
      purchase_price,
      location_id,
      status_id,
      assigned_to,
    })

    res.status(201).json(item)
  } catch (err) {
    if (err.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({ error: 'Inventory number already exists' })
    }

    res.status(500).json({ error: err.message })
  }
})

app.patch('/api/items/:id', requireAuth, async (req, res) => {
  try {
    const item = await Item.findByPk(req.params.id)
    if (!item) {
      return res.status(404).json({ error: 'Item not found' })
    }

    const {
      inventory_number,
      manufacturer,
      model,
      purchase_date,
      purchase_price,
      location_id,
      status_id,
      assigned_to,
    } = req.body

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

    res.status(200).json({ message: 'Item updated' })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.delete('/api/items/:id', requireAuth, async (req, res) => {
  try {
    const item = await Item.findByPk(req.params.id)
    if (!item) {
      return res.status(404).json({ error: 'Item not found' })
    }

    await item.destroy()
    res.status(200).json({ message: 'Item deleted' })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

startServer()

async function startServer() {
  try {
    await sequelize.sync() // Zamiast authenticate() - to połączy się i automatycznie utworzy brakujące tabele
    app.listen(4000, () => {
      console.log('API działa na http://localhost:4000')
    })
  } catch (err) {
    console.error('Błąd połączenia z bazą danych:', err)
  }
}

function getClientKey(req) {
  return req.ip || req.socket.remoteAddress || 'unknown'
}

function canAttemptLogin(clientKey) {
  const attempt = loginAttempts.get(clientKey)
  if (!attempt) return true

  if (attempt.resetAt <= Date.now()) {
    loginAttempts.delete(clientKey)
    return true
  }

  return attempt.count < 5
}

function registerFailedAttempt(clientKey) {
  const attempt = loginAttempts.get(clientKey)
  const now = Date.now()

  if (!attempt || attempt.resetAt <= now) {
    loginAttempts.set(clientKey, { count: 1, resetAt: now + 15 * 60 * 1000 })
    return
  }

  attempt.count += 1
}

async function createSession(res, userId) {
  const sessionToken = randomBytes(32).toString('base64url')
  await Session.create({
    token_hash: hashToken(sessionToken),
    user_id: userId,
    expires_at: new Date(Date.now() + 8 * 60 * 60 * 1000),
  })

  const cookie = `${authCookieName}=${sessionToken}; HttpOnly; SameSite=Lax; Path=/; Max-Age=28800${isProduction ? '; Secure' : ''}`
  res.setHeader('Set-Cookie', cookie)
}

function hashToken(token) {
  return createHash('sha256').update(token).digest('hex')
}

function getCookie(req, name) {
  const cookies = req.headers.cookie?.split(';') || []
  const cookie = cookies.find((entry) => entry.trim().startsWith(`${name}=`))
  return cookie ? cookie.trim().slice(name.length + 1) : null
}

async function requireAuth(req, res, next) {
  try {
    const sessionToken = getCookie(req, authCookieName)
    const session = sessionToken
      ? await Session.findOne({ where: { token_hash: hashToken(sessionToken) } })
      : null
    const user = session && session.expires_at > new Date()
      ? await User.findByPk(session.user_id, { 
          include: { model: UserRole, as: 'UserRole' } 
        })
      : null

    if (!user) {
      return res.status(401).json({ error: 'Wymagane logowanie.' })
    }

    req.user = {
      id: user.id,
      role: user.UserRole?.role || 'user',
    }
    return next()
  } catch {
    return res.status(401).json({ error: 'Wymagane logowanie.' })
  }
}

function validateItem(data) {
  if (!data.inventory_number || typeof data.inventory_number !== 'string')
    return 'Inventory number is required'

  if (data.purchase_price !== null && data.purchase_price !== undefined) {
    const purchasePrice = Number(data.purchase_price)
    if (!Number.isFinite(purchasePrice) || purchasePrice < 0)
      return 'Purchase price must be a non-negative number'
  }

  return null
}