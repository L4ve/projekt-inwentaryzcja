import { Router } from 'express'
import bcrypt from 'bcryptjs'
import { User, UserRole } from '../models/index.js'
import { onlyAdmin, requireAuth } from '../middleware/auth.js'
import { isValidEmail, normalizeEmail, parsePositiveInteger } from '../utils/validation.js'

const router = Router()

router.use(requireAuth, onlyAdmin)

router.get('/users', async (req, res) => {
  const users = await User.findAll({
    attributes: ['id', 'email', 'role_id'],
    include: { model: UserRole, as: 'UserRole', attributes: ['role'] },
    order: [['id', 'ASC']],
  })
  res.json(users.map(formatUser))
})

router.get('/roles', async (req, res) => {
  const roles = await UserRole.findAll({
    attributes: ['id', 'role'],
    order: [['id', 'ASC']],
  })
  res.json(roles)
})

router.post('/users', async (req, res) => {
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

router.patch('/users/:id', async (req, res) => {
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

router.delete('/users/:id', async (req, res) => {
  const userId = parsePositiveInteger(req.params.id)
  const user = userId ? await User.findByPk(userId) : null
  if (!user) return res.status(404).json({ error: 'Użytkownik nie istnieje.' })
  if (user.id === req.user.id) return res.status(400).json({ error: 'Nie możesz usunąć własnego konta.' })
  if (user.role_id === 1 && await countAdmins() <= 1) return res.status(400).json({ error: 'Nie można usunąć ostatniego administratora.' })

  await user.destroy()
  res.status(204).send()
})

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

export default router
