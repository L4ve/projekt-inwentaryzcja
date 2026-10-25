import { normalizeEmail } from './validation.js'

const loginAttempts = new Map()

export function getClientKey(req) {
  return `${req.ip || req.socket.remoteAddress || 'unknown'}:${normalizeEmail(req.body?.email)}`
}

export function canAttemptLogin(clientKey) {
  const attempt = loginAttempts.get(clientKey)
  if (!attempt) return true

  if (attempt.resetAt <= Date.now()) {
    loginAttempts.delete(clientKey)
    return true
  }

  return attempt.count < 5
}

export function registerFailedAttempt(clientKey) {
  const attempt = loginAttempts.get(clientKey)
  const now = Date.now()

  if (!attempt || attempt.resetAt <= now) {
    loginAttempts.set(clientKey, { count: 1, resetAt: now + 15 * 60 * 1000 })
    return
  }

  attempt.count += 1
}

export function clearFailedAttempts(clientKey) {
  loginAttempts.delete(clientKey)
}
