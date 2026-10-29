import dotenv from 'dotenv'

dotenv.config({ path: new URL('.env', import.meta.url) })

export const isProduction = process.env.NODE_ENV === 'production'
export const authCookieName = 'inventory_session'
