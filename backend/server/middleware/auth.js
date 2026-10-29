import { authCookieName } from '../config.js'
import { Session, User, UserRole } from '../models/index.js'
import { getCookie, hashToken } from '../utils/session.js'

export function canLogIn(role) {
  return role === 'admin' || role === 'manager'
}

export function onlyAdmin(req, res, next) {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Brak uprawnień.' })
  }
  next()
}

export function adminOrManager(req, res, next) {
  if (req.user.role !== 'admin' && req.user.role !== 'manager') {
    return res.status(403).json({ error: 'Brak uprawnień.' })
  }
  next()
}

export async function requireAuth(req, res, next) {
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
