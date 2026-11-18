import { Router } from 'express'
import { Location } from '../models/index.js'

const router = Router()

router.get('/', async (req, res) => {
  try {
    const locations = await Location.findAll()
    res.json(locations)
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Błąd serwera.' })
  }
})

export default router
