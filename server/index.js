import express from 'express'
import cors from 'cors'
import mysql from 'mysql2/promise' // bez promises strasznie niekoszernie ngl

const db = await mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'inwentarz',
})

const app = express()
app.use(cors())
app.use(express.json())

app.get('/api/items', async (req, res) => {
  try {
    const [items] = await db.query('SELECT * FROM item')
    res.json(items)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.get('/api/items/:id', async (req, res) => {
  try {
    const [items] = await db.query('SELECT * FROM item WHERE id = ?', [req.params.id])
    if (items.length === 0) {
      return res.status(404).json({ error: 'Item not found' })
    }

    res.json(items[0])
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.post('/api/items', async (req, res) => {
  try {
    const { inventory_number, manufacturer, model } = req.body
    const [result] = await db.query(
      'INSERT INTO item (inventory_number, manufacturer, model) VALUES (?, ?, ?)',
      [inventory_number, manufacturer, model]
    )
    res.json({ id: result.insertId })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.put('/api/items/:id', async (req, res) => {
  try {
    const [existingItems] = await db.query('SELECT * FROM item WHERE id = ?', [req.params.id])

    if (existingItems.length === 0) {
      return res.status(404).json({ error: 'Item not found' })
    }

    const currentItem = existingItems[0]
    const updatedItem = {
      ...currentItem,
      ...req.body,
    }

    await db.query(
      `UPDATE item
       SET inventory_number = ?,
           manufacturer = ?,
           model = ?,
           purchase_date = ?,
           purchase_price = ?,
           location_id = ?,
           status_id = ?,
           assigned_to = ?
       WHERE id = ?`,
      [
        updatedItem.inventory_number,
        updatedItem.manufacturer,
        updatedItem.model,
        updatedItem.purchase_date,
        updatedItem.purchase_price,
        updatedItem.location_id,
        updatedItem.status_id,
        updatedItem.assigned_to,
        req.params.id,
      ]
    )

    res.json({ message: 'Item updated' })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.delete('/api/items/:id', async (req, res) => {
  try {
    const [existingItems] = await db.query('SELECT id FROM item WHERE id = ?', [req.params.id])

    if (existingItems.length === 0) {
      return res.status(404).json({ error: 'Item not found' })
    }

    await db.query('DELETE FROM item WHERE id = ?', [req.params.id])

    res.json({ message: 'Item deleted' })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

app.listen(4000, () => {
  console.log('ale mi dryga api dziala oh ahhhh oh ahhhh http://localhost:4000')
})

/*                                                                                                            
                      ░░▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓                                ▓▓▓▓▓▓▒▒▓▓▓▓▓▓▓▓▓▓▓▓▒▒                    
                      ░░▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▒▒                                ▓▓▓▓▓▓▒▒▓▓▓▓▓▓▓▓▓▓▓▓▒▒                    
                      ░░▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓                                ▓▓▓▓▒▒▒▒▓▓▓▓▓▓▓▓▓▓▓▓▒▒                    
                        ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▒▒▒▒▓▓                                ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▒▒                    
                        ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▒▒▒▒                                ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▒▒                    
            ▓▓▓▓▓▓▓▓▓▓▒▒▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓          ▓▓▓▓▓▓▒▒▒▒▓▓▓▓██▓▓████▓▓▓▓██▓▓▒▒▓▓▒▒▒▒▒▒▒▒          
            ▓▓▓▓▓▓▓▓▓▓▓▓░░░░░░░░░░░░░░░░░░░░▓▓▓▓▓▓▓▓▓▓▓▓          ▓▓▓▓▓▓▓▓▓▓░░░░░░░░░░░░░░░░░░░░██▓▓▓▓▓▓▓▓▓▓          
            ▓▓▓▓▓▓▓▓▓▓▓▓                ░░░░▓▓▓▓▓▓▓▓▓▓▓▓          ▓▓▓▓▓▓▓▓▓▓░░              ░░░░██▓▓▓▓▓▓▓▓▓▓          
            ▓▓▓▓▓▓▓▓▓▓▓▓                  ░░▓▓▓▓▓▓▓▓▓▓▓▓          ▓▓▓▓▓▓▓▓▓▓░░                ░░██▓▓▓▓▓▓▓▓▓▓          
            ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓          ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓██▓▓▓▓▓▓▓▓▓▓          
  ▒▒▒▒▒▒▒▒▒▒▓▓████▓▓██▓▓▓▓▓▓▓▓▒▒▒▒▒▒▒▒▓▓▓▓▓▓▓▓▓▓██████▓▓▒▒░░░░▒▒▒▒██▓▓██▓▓▓▓▓▓▓▓▒▒▒▒▓▓▓▓▓▓▓▓▓▓▓▓████▓▓████▒▒▒▒░░▒▒  ▒▒
  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▒▒▒▒▒▒▒▒▒▒▒▒▒▒▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▒▒▒▒▒▒▒▒▓▓▒▒▓▓▓▓▓▓▓▓▓▓▓▓▓▓██▓▓▓▓▓▓▓▓▓▓
  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▓▓▓▓▓▓▓▓▓▓▓▓▓▓██▓▓▓▓▓▓▓▓▓▓
  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▒▒▒▒▒▒▒▒▒▒▒▒▒▒▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▒▒▓▓▓▓▒▒▒▒▒▒▓▓▒▒▒▒▒▒▒▒▓▓▓▓▓▓▓▓▓▓██▓▓▓▓▓▓▓▓▓▓
  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▒▒▓▓▒▒▒▒▒▒▓▓▒▒▒▒▒▒▒▒▒▒▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▓▓▓▓▓▓▓▓▓▓██▓▓▓▓▓▓▓▓▓▓
  ▓▓▓▓▓▓▓▓▓▓▓▓                                        ░░▒▒▒▒▒▒▒▒░░                                      ░░██▓▓▓▓▓▓▓▓▓▓
  ▓▓▓▓▓▓▓▓▓▓▓▓                                            ░░▓▓                                          ░░██▓▓▓▓▓▓▓▓▓▓
  ▓▓▓▓▓▓▓▓▓▓▓▓                                            ▓▓▓▓░░                                        ░░██▓▓▓▓▓▓▓▓▓▓
  ▓▓▓▓▓▓▓▓▓▓▓▓                                          ▒▒▒▒▒▒▓▓                                        ░░▓▓▓▓▓▓▓▓▓▓▓▓
  ▓▓▓▓▓▓▓▓▓▓▓▓                                          ▓▓▓▓  ▓▓░░                                      ░░▓▓▓▓▓▓▓▓▓▓▓▓
  ▓▓▓▓▓▓▓▓▓▓▓▓                            ░░▓▓▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒                            ░░▓▓▓▓▓▓▓▓▓▓▓▓
  ▓▓▒▒▓▓▓▓▓▓▓▓                              ▒▒▓▓▒▒░░░░▒▒░░░░░░░░▒▒▒▒░░▒▒▓▓░░                            ░░██▓▓▓▓▓▓▓▓▓▓
  ▒▒▓▓▓▓▓▓▓▓▓▓                                ▒▒▓▓  ▒▒▓▓        ▒▒▓▓  ▓▓▓▓                              ░░██▓▓▓▓▓▓▒▒▓▓
  ▓▓▓▓▓▓▓▓▓▓▓▓                                ▒▒▒▒▒▒▓▓░░          ▓▓▒▒▓▓▒▒                              ░░▓▓▓▓▓▓▓▓▓▓▓▓
  ▓▓▓▓▓▓▓▓▓▓▓▓                                  ▒▒▓▓▓▓            ░░▒▒▒▒                                ░░▓▓▓▓▓▓▓▓▓▓▓▓
            ▒▒▓▓▓▓▓▓▓▓▓▓                        ▓▓▒▒▒▒            ▒▒▒▒▓▓                        ▓▓▓▓▓▓▓▓▓▓            
            ▒▒▓▓▓▓▓▓▓▓▓▓                      ▓▓▒▒▒▒▓▓▒▒          ▒▒░░▒▒▒▒                    ░░▓▓▓▓▓▓▓▓▓▓            
              ▓▓▓▓▓▓▓▓▓▓░░                  ░░▒▒▓▓  ░░▒▒        ▒▒▓▓  ▒▒▓▓                    ░░▓▓▓▓▓▓▓▓▓▓            
            ▒▒▓▓▓▓▓▓▓▓▓▓                    ▓▓▒▒▒▒▓▓▓▓▒▒▓▓▓▓▓▓▓▓▒▒▒▒▓▓▒▒▒▒▒▒                  ░░▓▓▓▓▓▓▓▓▓▓            
              ▓▓▓▓▓▓▓▓▓▓░░                  ░░  ░░░░░░░░▒▒▒▒░░▒▒▒▒░░░░░░░░░░                  ░░▓▓▓▓▓▓▓▓▓▓            
                        ▓▓▓▓▓▓▓▓▓▓                      ▒▒▓▓░░▓▓                      ▓▓▓▓▓▓▓▓▓▓                      
                        ▓▓▓▓▓▓▓▓▓▓                        ▓▓▒▒▒▒                    ░░▓▓▓▓▓▓▓▓▓▓                      
                        ▓▓▓▓▓▓▓▓▓▓                        ░░▓▓                      ░░▓▓▓▓▓▓▓▓▓▓                      
                        ▓▓▓▓▓▓▓▓▓▓                          ░░                      ░░▓▓▓▓▓▓▓▓▓▓                      
                        ▓▓▓▓▓▓▓▓▓▓▓▓▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓                      
                                  ▓▓▓▓▓▓▓▓▓▓▓▓▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▓▓▓▓▓▓▓▓▓▓▓▓▓▓                                
                                  ▓▓▓▓▓▓▓▓▓▓▓▓▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▓▓▓▓▒▒▓▓▓▓▓▓▓▓▓▓▓▓▓▓                                
                                  ▓▓▓▓▓▓▓▓▓▓▓▓▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▒▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▒▒▓▓                                
                                  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▒▒▒▒▒▒▓▓▒▒▒▒▒▒▒▒▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▒▒▓▓                                
                                  ▓▓▓▓▒▒▒▒▓▓▒▒▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▒▒▒▒▓▓▓▓                                
                                  ░░░░    ░░▓▓▓▓▓▓▓▓▓▓▓▓▒▒▒▒▒▒▒▒▒▒▓▓▓▓▓▓▓▓▓▓                                          
                                            ▓▓▓▓▓▓▓▓▓▓▓▓        ░░▓▓▓▓▓▓▓▓▓▓                                          
                                            ▓▓▓▓▓▓▓▓▓▓▓▓        ░░▓▓▓▓▓▓▓▓▒▒                                          
                                            ▓▓▓▓▓▓▓▓▓▓▓▓        ░░▓▓▓▓▓▓▓▓▓▓                                          
                                            ▓▓▓▓▓▓▓▓▓▓▓▓      ░░░░▓▓▓▓▓▓▓▓▓▓                                          
                                            ▓▓▓▓▓▓▓▓▓▓▓▓▒▒▒▒░░▒▒▒▒▓▓▓▓▓▓▓▓▓▓                                          
                                                        ▓▓▓▓▓▓▓▓▓▓                                                    
                                                        ▓▓▓▓▓▓▓▓▓▓                                                    
                                                        ▓▓▓▓▓▓▓▓▓▓                                                    
                                                        ▓▓▓▓▓▓▓▓▓▓        
                                                      i saw the sign                                            
*/