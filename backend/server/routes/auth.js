import { Router } from 'express'
import bcrypt from 'bcryptjs'
import { authCookieName } from '../config.js'
import { User, UserRole, Session } from '../models/index.js'
import { canLogIn, requireAuth } from '../middleware/auth.js'
import { canAttemptLogin, clearFailedAttempts, getClientKey, registerFailedAttempt } from '../utils/loginLimit.js'
import { clearSessionCookie, createSession, getCookie, hashToken } from '../utils/session.js'
import { isValidEmail, normalizeEmail } from '../utils/validation.js'

const router = Router()
const dummyPasswordHash = '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy'

router.post('/login', async (req, res) => {
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

    clearFailedAttempts(clientKey)
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

router.get('/me', requireAuth, (req, res) => {
  res.status(200).json({ user: req.user })
})

router.post('/logout', async (req, res) => {
  const sessionToken = getCookie(req, authCookieName)
  if (sessionToken) {
    await Session.destroy({ where: { token_hash: hashToken(sessionToken) } })
  }

  clearSessionCookie(res)
  res.status(204).send()
})

export default router
