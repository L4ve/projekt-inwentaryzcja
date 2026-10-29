import { Router } from 'express'
import { Location } from '../models/index.js'
import { requireAuth } from '../middleware/auth.js'

const router = Router()

router.get('/', requireAuth, async (req, res) => {
  try {
    const locations = await Location.findAll()
    res.json(locations)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

export default router
