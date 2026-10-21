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
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

// --- DEFINICJE MODELI BAZY DANYCH ---
const UserRole = sequelize.define('UserRole', {
  role: DataTypes.STRING,
}, { tableName: 'user_role', timestamps: false })

const User = sequelize.define('User', {
  email: { type: DataTypes.STRING(254), unique: true },
  password_hash: DataTypes.STRING,
  role_id: DataTypes.INTEGER,
}, { tableName: 'user', timestamps: false })

const Session = sequelize.define('Session', {
  token_hash: { type: DataTypes.STRING(64), primaryKey: true },
  user_id: DataTypes.INTEGER,
  expires_at: DataTypes.DATE,
}, { tableName: 'auth_session', timestamps: false })

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

  const email = normalizeEmail(req.body?.email)
  const password = typeof req.body?.password === 'string' ? req.body.password : ''

  if (!isValidEmail(email) || password.length < 1 || password.length > 256) {
    registerFailedAttempt(clientKey)
    return res.status(401).json({ error: 'Nieprawidłowy identyfikator lub hasło.' })
  }

  try {
    const user = await User.findOne({ where: { email },
      include: { model: UserRole, as: 'UserRole' } 
    })
    const passwordHash = user?.password_hash?.replace('$2y$', '$2b$') || dummyPasswordHash
    const passwordMatches = await bcrypt.compare(password, passwordHash)

    if (!user || !passwordMatches) {
      registerFailedAttempt(clientKey)
      return res.status(401).json({ error: 'Nieprawidłowy identyfikator lub hasło.' })
    }

    const role = user.UserRole?.role || 'user'
    if (!canLogIn(role)) {
      return res.status(403).json({ error: 'To konto nie ma uprawnień do logowania.' })
    }

    loginAttempts.delete(clientKey)
    await createSession(res, user.id)

    return res.status(200).json({
      user: {
        id: user.id,
        role,
      },
    })
  } catch (err) {
    console.error('LOGIN ERROR:', err)
    return res.status(500).json({
      error: 'Nie udało się zalogować.',
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

app.get('/api/admin/users', requireAuth, onlyAdmin, async (req, res) => {
  const users = await User.findAll({
    attributes: ['id', 'email', 'role_id'],
    include: { model: UserRole, as: 'UserRole', attributes: ['role'] },
    order: [['id', 'ASC']],
  })
  res.json(users.map(formatUser))
})

app.get('/api/admin/roles', requireAuth, onlyAdmin, async (req, res) => {
  const roles = await UserRole.findAll({
    attributes: ['id', 'role'],
    order: [['id', 'ASC']],
  })
  res.json(roles)
})

app.post('/api/admin/users', requireAuth, onlyAdmin, async (req, res) => {
  const email = normalizeEmail(req.body?.email)
  const password = typeof req.body?.password === 'string' ? req.body.password : ''
  const roleId = Number(req.body?.roleId)

  if (!isValidEmail(email)) return res.status(400).json({ error: 'Podaj prawidłowy adres email.' })
  if (password.length < 12 || password.length > 128) return res.status(400).json({ error: 'Hasło musi mieć od 12 do 128 znaków.' })
  if (!Number.isInteger(roleId) || roleId <= 0) return res.status(400).json({ error: 'Wybierz prawidłową rolę.' })

  try {
    const role = await UserRole.findByPk(roleId)
    if (!role) return res.status(400).json({ error: 'Nieprawidłowa rola.' })
    const user = await User.create({
      email,
      password_hash: await bcrypt.hash(password, 12),
      role_id: role.id,
    })
    res.status(201).json(formatUser(await User.findByPk(user.id, {
      attributes: ['id', 'email', 'role_id'],
      include: { model: UserRole, as: 'UserRole', attributes: ['role'] },
    })))
  } catch (err) {
    if (err.name === 'SequelizeUniqueConstraintError') return res.status(409).json({ error: 'Ten adres email jest już zajęty.' })
    console.error('ADMIN CREATE USER ERROR:', err)
    res.status(500).json({ error: 'Nie udało się utworzyć użytkownika.' })
  }
})

app.patch('/api/admin/users/:id', requireAuth, onlyAdmin, async (req, res) => {
  const userId = parsePositiveInteger(req.params.id)
  const roleId = parsePositiveInteger(req.body?.roleId)
  if (!userId || !roleId) return res.status(400).json({ error: 'Nieprawidłowe dane użytkownika.' })

  const user = await User.findByPk(userId)
  const role = await UserRole.findByPk(roleId)
  if (!user || !role) return res.status(404).json({ error: 'Użytkownik lub rola nie istnieje.' })
  if (user.id === req.user.id && role.role !== 'admin') return res.status(400).json({ error: 'Nie możesz odebrać sobie roli administratora.' })
  if (user.role_id === 1 && role.id !== 1 && await countAdmins() <= 1) {
    return res.status(400).json({ error: 'System musi mieć co najmniej jednego administratora.' })
  }

  await user.update({ role_id: role.id })
  res.json({ message: 'Rola została zmieniona.' })
})

app.delete('/api/admin/users/:id', requireAuth, onlyAdmin, async (req, res) => {
  const userId = parsePositiveInteger(req.params.id)
  const user = userId ? await User.findByPk(userId) : null
  if (!user) return res.status(404).json({ error: 'Użytkownik nie istnieje.' })
  if (user.id === req.user.id) return res.status(400).json({ error: 'Nie możesz usunąć własnego konta.' })
  if (user.role_id === 1 && await countAdmins() <= 1) return res.status(400).json({ error: 'Nie można usunąć ostatniego administratora.' })

  await user.destroy()
  res.status(204).send()
})

// --- ENDPOINTY DLA ITEMÓW ---

app.get('/api/items/details', requireAuth, async (req, res) => {
  try {
    const items = await Item.findAll({
      include: [
        { model: ItemStatus, as: 'status', attributes: ['id', 'name'] },
        { model: Location, as: 'location', attributes: ['id', 'building', 'room'] },
        {
          model: User,
          as: 'assignedUser',
          attributes: ['id', 'email', 'role_id'],
          include: { model: UserRole, as: 'UserRole', attributes: ['role'] },
        },
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

app.post('/api/items', requireAuth, onlyAdmin, async (req, res) => {
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

app.patch('/api/items/:id', requireAuth, onlyAdmin, async (req, res) => {
  try {
    const item = await Item.findByPk(req.params.id)
    if (!item) {
      return res.status(404).json({ error: 'Item not found' })
    }

    const inventory_number = typeof req.body.inventory_number === 'string'
      ? req.body.inventory_number.trim()
      : ''
    const manufacturer = req.body.manufacturer || null
    const model = req.body.model || null
    const purchase_date = req.body.purchase_date || null
    const purchase_price = req.body.purchase_price === null || req.body.purchase_price === ''
      ? null
      : Number(req.body.purchase_price)
    const location_id = req.body.location_id === null || req.body.location_id === ''
      ? null
      : Number(req.body.location_id)
    const status_id = Number(req.body.status_id)
    const assigned_to = req.body.assigned_to === null || req.body.assigned_to === ''
      ? null
      : Number(req.body.assigned_to)

    const validationError = validateItem({ inventory_number, purchase_price })
    if (validationError || !Number.isInteger(status_id) || status_id <= 0) {
      return res.status(400).json({ error: validationError || 'Nieprawidłowe dane sprzętu.' })
    }
    const [status, location, assignedUser] = await Promise.all([
      ItemStatus.findByPk(status_id),
      location_id === null ? null : Location.findByPk(location_id),
      assigned_to === null ? null : User.findByPk(assigned_to),
    ])
    if (!status || (location_id !== null && !location) || (assigned_to !== null && !assignedUser)) {
      return res.status(400).json({ error: 'Wybrany status, lokalizacja lub użytkownik nie istnieje.' })
    }

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

    res.status(200).json({ message: 'Item updated', item })
  } catch (err) {
    if (err.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({ error: 'Inventory number already exists' })
    }
    res.status(500).json({ error: err.message })
  }
})

app.delete('/api/items/:id', requireAuth, onlyAdmin, async (req, res) => {
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

app.get('/api/locations', requireAuth, async (req, res) => {
  try {
    const locations = await Location.findAll()
    res.json(locations)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.patch('/api/items/:id/location', requireAuth, adminOrManager, async (req, res) => {
  try {
    await Item.update({ location_id: req.body.location_id }, { where: { id: req.params.id } })
    res.json({ message: 'Item moved' })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

startServer()

async function startServer() {
  try {
    await sequelize.authenticate()
    app.listen(4000, () => {
      console.log('API działa na http://localhost:4000')
    })
  } catch (err) {
    console.error('Błąd połączenia z bazą danych:', err)
  }
}

function getClientKey(req) {
  return `${req.ip || req.socket.remoteAddress || 'unknown'}:${normalizeEmail(req.body?.email)}`
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

function canLogIn(role) {
  return role === 'admin' || role === 'manager'
}

function onlyAdmin(req, res, next) {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Brak uprawnień.' })
  }
  next()
}

function adminOrManager(req, res, next) {
  if (req.user.role !== 'admin' && req.user.role !== 'manager') {
    return res.status(403).json({ error: 'Brak uprawnień.' })
  }
  next()
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

    const role = user.UserRole?.role || 'user'
    if (!canLogIn(role)) {
      return res.status(401).json({ error: 'Wymagane logowanie.' })
    }

    req.user = {
      id: user.id,
      role,
    }
    return next()
  } catch (err) {
    console.error('AUTH ERROR:', err)
    return res.status(401).json({ error: 'Wymagane logowanie.' })
  }
}

function validateItem(data) {
  if (typeof data.inventory_number !== 'string' || !/^[A-Za-z0-9][A-Za-z0-9._-]{0,99}$/.test(data.inventory_number.trim()))
    return 'Numer inwentarzowy ma nieprawidłowy format'

  if (data.purchase_price !== null && data.purchase_price !== undefined) {
    const purchasePrice = Number(data.purchase_price)
    if (!Number.isFinite(purchasePrice) || purchasePrice < 0)
      return 'Purchase price must be a non-negative number'
  }

  return null
}

function normalizeEmail(email) {
  return typeof email === 'string' ? email.trim().toLowerCase() : ''
}

function isValidEmail(email) {
  return email.length <= 254 && emailPattern.test(email)
}

function parsePositiveInteger(value) {
  const number = Number(value)
  return Number.isInteger(number) && number > 0 ? number : null
}

function formatUser(user) {
  return {
    id: user.id,
    email: user.email,
    roleId: user.role_id,
    role: user.UserRole?.role || 'user',
  }
}

async function countAdmins() {
  return User.count({ where: { role_id: 1 } })
}