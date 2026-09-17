import express from 'express'
import cors from 'cors'
import mysql from 'mysql2/promise' // bez promises strasznie gejowo ngl

const db = await mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'inwentarz',
})

const app = express()
app.use(cors())

app.get('/api/items', async (req, res) => {
  const [items] = await db.query('SELECT * FROM item')
  res.json(items)
})

app.listen(4000, () => {
  console.log('ale mi dryga api dziala oh ahhhh oh ahhhh http://localhost:4000')
})