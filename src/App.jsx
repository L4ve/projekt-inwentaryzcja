import { useState } from 'react'
import './App.css'

const equipment = [
  {
    inventory: "INV-2026-001",
    product: <>Dell XPS 15 9520</>,
    location: <>Biuro 102</>,
    assigned: "Moderator",
    status: "Aktywny",
    statusClass: "active-status",
  },
];

function Sidebar({ setActivePage }) {
  return (
    <aside className="sidebar">
      <button className="nav-item" type="button" onClick={() => setActivePage("equipment")}>
        <span>• Ewidencja Sprzętu</span>
      </button>

      <button className="nav-item" type="button" onClick={() => setActivePage("logs")}>
        <span>• Logi</span>
      </button>

      <button className="nav-item" type="button" onClick={() => setActivePage("access")}>
        <span>• Zarządzanie Dostępem</span>
      </button>
    </aside>
  );
}

function StatusBadge({ status, statusClass }) {
  return (
    <span className={`status ${statusClass}`}>
      <span className="dot"></span>
      {status}
    </span>
  );
}

function EquipmentTable() {
  return (
    <div className="table-wrapper">
      <table>
        <thead>
          <tr>
            <th>NR INWENTARZOWY</th>
            <th>PRODUCENT I MODEL</th>
            <th>LOKALIZACJA</th>
            <th>PRZYPISANY DO</th>
            <th>STATUS</th>
            <th>AKCJE</th>
          </tr>
        </thead>
        <tbody>
          {equipment.map((item) => (
            <tr key={item.inventory}>
              <td className="inventory">{item.inventory}</td>
              <td className="product">{item.product}</td>
              <td>{item.location}</td>
              <td>
                {item.assigned ? (
                  <span className="assigned">{item.assigned}</span>
                ) : (
                  <span className="dash">—</span>
                )}
              </td>
              <td>
                <StatusBadge status={item.status} statusClass={item.statusClass} />
              </td>
              <td className="actions">
                <button className="action-menu" type="button" aria-label={`Akcje dla ${item.inventory}`}>
                  ⋮
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function App() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("Wszystkie");
  const [assigned, setAssigned] = useState("Wszyscy");

  return (
    <>
      <header className="topbar">
        <div className="logo">
          📦 Ewidencja <span>Sprzętu</span>
        </div>
      </header>
      <div className="layout">
        <Sidebar/>
        <main className="main">
          <div className="heading-row">
            <div className="filters">
              <input type="text" placeholder="Szukaj po nr inwentarzowym, marce, modelu." value={search} onChange={(e) => setSearch(e.target.value)}/>
            </div>

            <div className="status">
              <select value={status} onChange={(e) => setStatus(e.target.value)}>
                <option value="Wszystkie">Status: Wszystkie</option>
                <option value="Aktywny">Status: Aktywny</option>
                <option value="Nieaktywny">Status: Nieaktywny</option>
                <option value="Wydany">Status: Wydany</option>
                <option value="Uszkodzony">Status: Uszkodzony</option>
              </select>
            </div>

            <div className="assigned">
              <select value={assigned} onChange={(e) => setAssigned(e.target.value)}>
                <option value="Wszyscy">Przypisany: Wszyscy</option>
                <option value="Moderator">Przypisany: Moderator</option>
                <option value="Admin">Przypisany: Admin</option>
                <option value="Nikt">Przypisany: Nikt</option>
              </select>
            </div>
          </div>
          <EquipmentTable />
        </main>
      </div>
    </>
  );
}

export default App;