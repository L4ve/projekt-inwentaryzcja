import { useEffect, useState } from 'react'
import { getItemsWithDetails, getLocations, getUsers, moveItem } from '../api/items'
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

function Items({ role, search, statusFilter, assignedFilter, onAssignedUsersChange }) {
  const [items, setItems] = useState([])
  const [locations, setLocations] = useState([])
  const [users, setUsers] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [sortBy, setSortBy] = useState('inventory_number')

  const canMove = role === 'admin' || role === 'manager'
  const isAdmin = role === 'admin'

  async function loadItems() {
    try {
      setError('')
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

  async function loadUsers() {
    if (!isAdmin) return
    try {
      setUsers(await getUsers())
    } catch {
      setUsers([])
    }
  }

  useEffect(() => {
    loadItems()
    loadLocations()
    loadUsers()
  }, [])

  useEffect(() => {
    const roles = [...new Set(items
      .map((item) => item.assignedUser?.UserRole?.role)
      .filter(Boolean))]
      .sort((first, second) => first.localeCompare(second))
    onAssignedUsersChange(roles)
  }, [items, onAssignedUsersChange])

  function openForm() {
    setShowForm(true)
  }

  function closeForm() {
    setShowForm(false)
    setEditingItem(null)
  }

  async function handleSaved() {
    setShowForm(false)
    setEditingItem(null)
    await loadItems()
  }

  function openEditForm(item) {
    setEditingItem(item)
    setShowForm(true)
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
    form = <ItemForm key={editingItem?.id || 'new'} item={editingItem} locations={locations} users={users} onSaved={handleSaved} onCancel={closeForm} />
  }

  let moveHeader = null
  if (canMove) {
    moveHeader = <th>Przenieś do</th>
  }

  const normalizedSearch = search.trim().toLowerCase()
  const visibleItems = items.filter((item) => {
    const searchableText = [
      item.inventory_number,
      item.manufacturer,
      item.model,
      item.location?.building,
      item.location?.room,
      item.assignedUser?.email,
    ].filter(Boolean).join(" ").toLowerCase()
    const matchesSearch = !normalizedSearch || searchableText.includes(normalizedSearch)
    const matchesStatus = statusFilter === "Wszystkie" || item.status?.name === statusFilter
    const matchesAssigned = assignedFilter === "Wszyscy"
      || (assignedFilter === "Nikt" && !item.assignedUser)
      || item.assignedUser?.UserRole?.role === assignedFilter
    return matchesSearch && matchesStatus && matchesAssigned
  })

  function compareItems(a, b) {
    let first = a[sortBy]
    let second = b[sortBy]

    if (first === null) {
      first = ''
    }
    if (second === null) {
      second = ''
    }

    return String(first).localeCompare(String(second), 'pl')
  }

  const sortedItems = visibleItems.slice().sort(compareItems)

  return (
    <div className={tableClass}>
      {addButton}
      {form}
      <select className="sort-select" value={sortBy} onChange={(event) => setSortBy(event.target.value)}>
        <option value="inventory_number">Sortuj: numer inwentarzowy</option>
        <option value="manufacturer">Sortuj: producent</option>
        <option value="model">Sortuj: model</option>
      </select>
      <table>
        <thead>
          <tr>
            <th>Nr inwentarzowy</th>
            <th>Producent i model</th>
            <th>Lokalizacja</th>
            <th>Przypisany do</th>
            <th>Status</th>
            {isAdmin && <th>Edytuj</th>}
            {moveHeader}
          </tr>
        </thead>
        <tbody>
          {sortedItems.map((item) => {
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
                <td>{item.assignedUser?.email || <span className="dash">—</span>}</td>
                <td>
                  <span className={`status-pill ${status.variant}`}>
                    <span className="status-pill-dot" />{status.label}</span>
                </td>
                {isAdmin && (
                  <td>
                    <button type="button" className="edit-button" onClick={() => openEditForm(item)}>
                      Edytuj
                    </button>
                  </td>
                )}
                {moveCell}
              </tr>
            )
          })}
        </tbody>
      </table>
      {visibleItems.length === 0 && <p className="items-message">Brak sprzętu do wyświetlenia.</p>}
    </div>
  )
}

export default Items