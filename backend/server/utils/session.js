import { createHash, randomBytes } from 'node:crypto'
import { authCookieName, isProduction } from '../config.js'
import { Session } from '../models/index.js'

export function hashToken(token) {
  return createHash('sha256').update(token).digest('hex')
}

export function getCookie(req, name) {
  const cookies = req.headers.cookie?.split(';') || []
  const cookie = cookies.find((entry) => entry.trim().startsWith(`${name}=`))
  return cookie ? cookie.trim().slice(name.length + 1) : null
}

export async function createSession(res, userId) {
  const sessionToken = randomBytes(32).toString('base64url')
  await Session.create({
    token_hash: hashToken(sessionToken),
    user_id: userId,
    expires_at: new Date(Date.now() + 8 * 60 * 60 * 1000),
  })

  const cookie = `${authCookieName}=${sessionToken}; HttpOnly; SameSite=Lax; Path=/; Max-Age=28800${isProduction ? '; Secure' : ''}`
  res.setHeader('Set-Cookie', cookie)
}

export function clearSessionCookie(res) {
  res.setHeader('Set-Cookie', `${authCookieName}=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0${isProduction ? '; Secure' : ''}`)
}
