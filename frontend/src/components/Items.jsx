import { useEffect, useState } from 'react'
import { getItemsWithDetails } from '../api/items'

const statusLabels = {
  active: { label: 'Aktywny', variant: 'active' },
  in_repair: { label: 'W naprawie', variant: 'repair' },
  in_storage: { label: 'W magazynie', variant: 'archive' },
  retired: { label: 'Wycofany', variant: 'archive' },
  lost: { label: 'Zaginiony', variant: 'damaged' },
}

function Items() {
  const [items, setItems] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function loadItems() {
      try {
        setItems(await getItemsWithDetails())
      } catch (error) {
        setError(error.message)
      } finally {
        setIsLoading(false)
      }
    }

    loadItems()
  }, [])

  if (isLoading) {
    return <p className="items-message">Ładowanie sprzętu...</p>
  }

  if (error) {
    return <p className="items-message">Nie udało się pobrać sprzętu: {error}</p>
  }

  return (
    <div className="table-wrapper items">
      <table>
        <thead>
          <tr>
            <th>Nr inwentarzowy</th>
            <th>Producent i model</th>
            <th>Lokalizacja</th>
            <th>Przypisany do</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => {
            const status = statusLabels[item.status?.name] ?? { label: item.status?.name ?? 'Nieznany', variant: 'archive',}

            return (
              <tr key={item.id}>
                <td className="inventory">{item.inventory_number}</td>
                <td className="product">{item.manufacturer} {item.model}</td>
                <td>
                  {item.location ? `${item.location.building}, ${item.location.room}` : <span className="dash">—</span>}</td>
                <td>{item.assignedUser ? `Użytkownik ${item.assignedUser.id} (rola ${item.assignedUser.role_id})` : <span className="dash">—</span>}</td>
                <td>
                  <span className={`status-pill ${status.variant}`}>
                    <span className="status-pill-dot" />{status.label}</span>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
      {items.length === 0 && <p className="items-message">Brak sprzętu do wyświetlenia.</p>}
    </div>
  )
}

export default Items