import { useEffect, useState } from 'react'
import { getItemsWithDetails, getLocations, moveItem } from '../api/items'
import ItemForm from './ItemForm'

const statusLabels = {
  active: { label: 'Aktywny', variant: 'active' },
  in_repair: { label: 'W naprawie', variant: 'repair' },
  in_storage: { label: 'W magazynie', variant: 'archive' },
  retired: { label: 'Wycofany', variant: 'archive' },
  lost: { label: 'Zaginiony', variant: 'damaged' },
}

function LocationSelect({ item, locations, onMove }) {
  let currentLocation = ''
  if (item.location) {
    currentLocation = item.location.id
  }

  function handleChange(event) {
    onMove(item.id, event.target.value)
  }

  return (
    <select value={currentLocation} onChange={handleChange}>
      <option value="" disabled>Bez lokalizacji</option>
      {locations.map((location) => (
        <option key={location.id} value={location.id}>{location.building}, {location.room}</option>
      ))}
    </select>
  )
}

function Items({ role }) {
  const [items, setItems] = useState([])
  const [locations, setLocations] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)

  const canMove = role === 'admin' || role === 'manager'
  const isAdmin = role === 'admin'

  async function loadItems() {
    try {
      setItems(await getItemsWithDetails())
    } catch (error) {
      setError(error.message)
    } finally {
      setIsLoading(false)
    }
  }

  async function loadLocations() {
    try {
      setLocations(await getLocations())
    } catch {
      setLocations([])
    }
  }

  useEffect(() => {
    loadItems()
    loadLocations()
  }, [])

  function openForm() {
    setShowForm(true)
  }

  function closeForm() {
    setShowForm(false)
  }

  function handleSaved() {
    setShowForm(false)
    loadItems()
  }

  async function handleMove(id, locationId) {
    try {
      await moveItem(id, locationId)
      loadItems()
    } catch (moveError) {
      alert(moveError.message)
    }
  }

  if (isLoading) {
    return <p className="items-message">Ładowanie sprzętu...</p>
  }

  if (error) {
    return <p className="items-message">Nie udało się pobrać sprzętu: {error}</p>
  }

  let tableClass = 'table-wrapper items'
  if (canMove) {
    tableClass = 'table-wrapper items with-actions'
  }

  let addButton = null
  if (isAdmin && !showForm) {
    addButton = <button className="add-button" type="button" onClick={openForm}>Dodaj sprzęt</button>
  }

  let form = null
  if (showForm) {
    form = <ItemForm onSaved={handleSaved} onCancel={closeForm} />
  }

  let moveHeader = null
  if (canMove) {
    moveHeader = <th>Przenieś do</th>
  }

  return (
    <div className={tableClass}>
      {addButton}
      {form}
      <table>
        <thead>
          <tr>
            <th>Nr inwentarzowy</th>
            <th>Producent i model</th>
            <th>Lokalizacja</th>
            <th>Przypisany do</th>
            <th>Status</th>
            {moveHeader}
          </tr>
        </thead>
        <tbody>
          {items.map((item) => {
            const status = statusLabels[item.status?.name] ?? { label: item.status?.name ?? 'Nieznany', variant: 'archive',}

            let moveCell = null
            if (canMove) {
              moveCell = (
                <td>
                  <LocationSelect item={item} locations={locations} onMove={handleMove} />
                </td>
              )
            }

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
                {moveCell}
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