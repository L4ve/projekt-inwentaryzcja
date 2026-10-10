import { useEffect, useState } from 'react'
import { deleteItem, getItemsWithDetails, getLocations, moveItem } from '../api/items'
import ItemForm from './ItemForm'

const statusLabels = {
  active: { label: 'Aktywny', variant: 'active' },
  in_repair: { label: 'W naprawie', variant: 'repair' },
  in_storage: { label: 'W magazynie', variant: 'archive' },
  retired: { label: 'Wycofany', variant: 'archive' },
  lost: { label: 'Zaginiony', variant: 'damaged' },
}

function Items({ role }) {
  const [items, setItems] = useState([])
  const [locations, setLocations] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [formItem, setFormItem] = useState(null)

  const canMove = role === 'admin' || role === 'manager'
  const isAdmin = role === 'admin'

  async function loadItems() {
    try {
      setItems(await getItemsWithDetails())
    } catch (loadError) {
      setError(loadError.message)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadItems()
    getLocations().then(setLocations).catch(() => setLocations([]))
  }, [])

  async function handleMove(id, locationId) {
    try {
      await moveItem(id, locationId)
      loadItems()
    } catch (moveError) {
      alert(moveError.message)
    }
  }

  async function handleDelete(id) {
    if (!confirm('Usunąć ten sprzęt?')) return

    try {
      await deleteItem(id)
      loadItems()
    } catch (deleteError) {
      alert(deleteError.message)
    }
  }

  if (isLoading) {
    return <p className="items-message">Ładowanie sprzętu...</p>
  }

  if (error) {
    return <p className="items-message">Nie udało się pobrać sprzętu: {error}</p>
  }

  return (
    <div className={`table-wrapper items${canMove ? ' with-actions' : ''}`}>
      {isAdmin && !formItem && (
        <button className="add-button" type="button" onClick={() => setFormItem({})}>Dodaj sprzęt</button>
      )}
      {formItem && <ItemForm key={formItem.id} item={formItem} onSaved={() => { setFormItem(null); loadItems() }} onCancel={() => setFormItem(null)} />}
      <table>
        <thead>
          <tr>
            <th>Nr inwentarzowy</th>
            <th>Producent i model</th>
            <th>Lokalizacja</th>
            <th>Przypisany do</th>
            <th>Status</th>
            {canMove && <th>Akcje</th>}
          </tr>
        </thead>
        <tbody>
          {items.map((item) => {
            const status = statusLabels[item.status?.name] ?? {
              label: item.status?.name ?? 'Nieznany',
              variant: 'archive',
            }

            return (
              <tr key={item.id}>
                <td className="inventory">{item.inventory_number}</td>
                <td className="product">{item.manufacturer} {item.model}</td>
                <td>
                  {item.location
                    ? `${item.location.building}, ${item.location.room}`
                    : <span className="dash">—</span>}
                </td>
                <td>
                  {item.assignedUser
                    ? `Użytkownik ${item.assignedUser.id} (rola ${item.assignedUser.role_id})`
                    : <span className="dash">—</span>}
                </td>
                <td>
                  <span className={`status-pill ${status.variant}`}>
                    <span className="status-pill-dot" />
                    {status.label}
                  </span>
                </td>
                {canMove && (
                  <td>
                    <div className="row-actions">
                      <select value={item.location ? item.location.id : ''} onChange={(event) => handleMove(item.id, event.target.value)}>
                        <option value="" disabled>Bez lokalizacji</option>
                        {locations.map((location) => (
                          <option key={location.id} value={location.id}>{location.building}, {location.room}</option>
                        ))}
                      </select>
                      {isAdmin && <button type="button" onClick={() => setFormItem(item)}>Edytuj</button>}
                      {isAdmin && <button type="button" onClick={() => handleDelete(item.id)}>Usuń</button>}
                    </div>
                  </td>
                )}
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
