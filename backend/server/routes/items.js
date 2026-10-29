import { Router } from 'express'
import { Item, ItemStatus, Location, User, UserRole } from '../models/index.js'
import { adminOrManager, onlyAdmin, requireAuth } from '../middleware/auth.js'
import { validateItem } from '../utils/validation.js'

const router = Router()

// UWAGA: '/details' musi być przed '/:id', inaczej "details" zostanie potraktowane jako id
router.get('/details', requireAuth, async (req, res) => {
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

router.get('/:id', requireAuth, async (req, res) => {
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

router.get('/', requireAuth, async (req, res) => {
  try {
    const items = await Item.findAll()
    res.status(200).json(items)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

router.post('/', requireAuth, onlyAdmin, async (req, res) => {
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

router.patch('/:id', requireAuth, onlyAdmin, async (req, res) => {
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

router.delete('/:id', requireAuth, onlyAdmin, async (req, res) => {
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

router.patch('/:id/location', requireAuth, adminOrManager, async (req, res) => {
  try {
    await Item.update({ location_id: req.body.location_id }, { where: { id: req.params.id } })
    res.json({ message: 'Item moved' })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

export default router
