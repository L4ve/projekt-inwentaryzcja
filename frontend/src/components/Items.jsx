import { useEffect, useState } from 'react'
import { deleteItem, getItemsWithDetails, getLocations, getUsers, moveItem } from '../api/items'
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
    <select className="form-select form-select-sm" value={currentLocation} onChange={handleChange}>
      <option value="" disabled>Bez lokalizacji</option>
      {locations.map((location) => (
        <option key={location.id} value={location.id}>{location.building}, {location.room}</option>
      ))}
    </select>
  )
}

function Toolbar({ search, onSearchChange, statusFilter, onStatusFilterChange, assignedFilter, onAssignedFilterChange, assignedUsers, sortBy, onSortChange, children }) {
  return (
    <div className="toolbar d-flex flex-wrap gap-2 mb-3">
      <div className="search position-relative">
        <i className="bi bi-search position-absolute top-50 translate-middle-y ms-3 text-secondary" />
        <input className="form-control ps-5" type="text" aria-label="Szukaj" placeholder="Szukaj po nr inwentarzowym, marce, modelu." value={search} onChange={(e) => onSearchChange(e.target.value)}/>
      </div>
      <select className="form-select fw-medium" aria-label="Status" value={statusFilter} onChange={(e) => onStatusFilterChange(e.target.value)}>
        <option value="Wszystkie">Status: Wszystkie</option>
        <option value="active">Status: Aktywny</option>
        <option value="in_repair">Status: W naprawie</option>
        <option value="in_storage">Status: W magazynie</option>
        <option value="retired">Status: Wycofany</option>
        <option value="lost">Status: Zaginiony</option>
      </select>
      <select className="form-select fw-medium" aria-label="Przypisany" value={assignedFilter} onChange={(e) => onAssignedFilterChange(e.target.value)}>
        <option value="Wszyscy">Przypisany: Wszyscy</option>
        <option value="Nikt">Przypisany: Nikt</option>
        {assignedUsers.map((role) => (
          <option key={role} value={role}>Przypisany: {role}</option>
        ))}
      </select>
      <select className="form-select fw-medium sort-select" aria-label="Sortowanie" value={sortBy} onChange={(event) => onSortChange(event.target.value)}>
        <option value="inventory_number">Sortuj: numer inwentarzowy</option>
        <option value="manufacturer">Sortuj: producent</option>
        <option value="model">Sortuj: model</option>
      </select>
      {children}
    </div>
  )
}

function Items({ role, search, onSearchChange, statusFilter, onStatusFilterChange, assignedFilter, onAssignedFilterChange, assignedUsers, onAssignedUsersChange }) {
  const [items, setItems] = useState([])
  const [locations, setLocations] = useState([])
  const [users, setUsers] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState('')
  const [actionError, setActionError] = useState('')
  const [deletingItemId, setDeletingItemId] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [sortBy, setSortBy] = useState('inventory_number')

  const canMove = role === 'manager'
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

  useEffect(() => {
    document.body.style.overflow = showForm ? 'hidden' : ''
    return () => {
      document.body.style.overflow = ''
    }
  }, [showForm])

  function openForm() {
    setEditingItem(null)
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

  async function handleDelete(item) {
    if (!window.confirm(`Czy na pewno usunąć sprzęt ${item.inventory_number}? Tej operacji nie można cofnąć.`)) {
      return
    }

    try {
      setDeletingItemId(item.id)
      setActionError('')
      await deleteItem(item.id)
      await loadItems()
    } catch (deleteError) {
      setActionError(deleteError.message)
    } finally {
      setDeletingItemId(null)
    }
  }

  const toolbarProps = {
    search,
    onSearchChange,
    statusFilter,
    onStatusFilterChange,
    assignedFilter,
    onAssignedFilterChange,
    assignedUsers,
    sortBy,
    onSortChange: setSortBy,
  }

  if (isLoading) {
    return (
      <>
        <Toolbar {...toolbarProps} />
        <p className="text-secondary p-3">Ładowanie sprzętu...</p>
      </>
    )
  }

  if (error) {
    return (
      <>
        <Toolbar {...toolbarProps} />
        <p className="text-secondary p-3">Nie udało się pobrać sprzętu: {error}</p>
      </>
    )
  }

  let addButton = null
  if (isAdmin && !showForm) {
    addButton = (
      <button className="btn btn-primary d-flex align-items-center justify-content-center gap-2 ms-auto" type="button" onClick={openForm}>
        <i className="bi bi-plus-lg" />
        Dodaj sprzęt
      </button>
    )
  }

  let form = null
  if (showForm) {
    form = (
      <div className="modal item-modal d-block" tabIndex="-1" role="dialog" aria-modal="true">
        <div className="modal-dialog modal-dialog-centered modal-dialog-scrollable modal-fullscreen-sm-down">
          <div className="modal-content border-0 shadow-lg">
            <div className="modal-header bg-body-tertiary">
              <h2 className="modal-title fs-6 fw-semibold">{editingItem ? `Edycja: ${editingItem.manufacturer} ${editingItem.model}` : 'Dodaj nowy sprzęt'}</h2>
            </div>
            <ItemForm
              key={editingItem?.id || 'new'}
              item={editingItem}
              locations={locations}
              users={users}
              onSaved={handleSaved}
              onCancel={closeForm}
            />
          </div>
        </div>
      </div>
    )
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
    <>
      <Toolbar {...toolbarProps}>{addButton}</Toolbar>
      {form}
      <div className="card items-card overflow-hidden">
        <div className="table-responsive">
          <table className="table table-hover align-middle mb-0 items-table">
            <thead>
              <tr>
                <th>Nr inwentarzowy</th>
                <th>Producent i model</th>
                <th>Lokalizacja</th>
                <th>Przypisany do</th>
                <th>Status</th>
                {moveHeader}
                {isAdmin && <th>Akcje</th>}
              </tr>
            </thead>
            <tbody>
              {sortedItems.map((item) => {
                const status = statusLabels[item.status?.name] ?? { label: item.status?.name ?? 'Nieznany', variant: 'archive',}

                let moveCell = null
                if (canMove) {
                  moveCell = (
                    <td data-label="Przenieś do">
                      <LocationSelect item={item} locations={locations} onMove={handleMove} />
                    </td>
                  )
                }

                return (
                  <tr key={item.id}>
                    <td>
                      <span className="inventory-tag badge font-monospace fw-medium text-body bg-body-tertiary border">{item.inventory_number}</span>
                    </td>
                    <td className="product fw-medium text-body">{item.manufacturer} {item.model}</td>
                    <td data-label="Lokalizacja">
                      {item.location ? `${item.location.building}, ${item.location.room}` : <span className="text-secondary">—</span>}
                    </td>
                    <td data-label="Przypisany do">{item.assignedUser?.email || <span className="text-secondary">—</span>}</td>
                    <td data-label="Status">
                      <span className="d-inline-flex align-items-center gap-2 fw-medium">
                        <span className={`status-dot rounded-circle ${status.variant}`} />
                        {status.label}
                      </span>
                    </td>
                    {moveCell}
                    {isAdmin && (
                      <td className="actions-cell">
                        <div className="row-actions d-flex gap-1">
                          <button type="button" className="btn btn-sm btn-outline-secondary d-flex align-items-center gap-1" onClick={() => openEditForm(item)}>
                            <i className="bi bi-pencil" />
                            Edytuj
                          </button>
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-danger d-flex align-items-center gap-1"
                            onClick={() => handleDelete(item)}
                            disabled={deletingItemId !== null}
                          >
                            <i className="bi bi-trash" />
                            {deletingItemId === item.id ? 'Usuwanie...' : 'Usuń'}
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        {actionError && <p className="text-danger p-3 mb-0" role="alert">{actionError}</p>}
        {visibleItems.length === 0 && <p className="text-secondary p-3 mb-0">Brak sprzętu do wyświetlenia.</p>}
      </div>
    </>
  )
}

export default Items
