import { useState } from 'react'
import heroImg from './assets/hero.png'
import reactLogo from './assets/react.svg'
import viteLogo from './assets/vite.svg'
import './App.css'

const equipment = [
  {
    inventory: "INV-2026-001",
    product: <>Dell XPS 15<br />9520</>,
    location: <>Biuro 102</>,
    assigned: "Moderator",
    assignedIcon: "👤",
    status: "Aktywny",
    statusClass: "active-status",
  },

];

function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="nav-item active">
        <span>Ewidencja Sprzętu</span>
      </div>

      <div className="nav-item">
       
        <span>Logi Audytowe</span>
      </div>
      <div className="nav-item">
        <span>Zarządzanie Dostępem</span>
      </div>
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
            <th>NR<br />INWENTARZOWY</th>
            <th>PRODUCENT I<br />MODEL</th>
            <th>LOKALIZACJA</th>
            <th>PRZYPISANY<br />DO</th>
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
                  <span className="assigned">
                    <span className="assigned-icon">{item.assignedIcon}</span>
                    {item.assigned}
                  </span>
                ) : (
                  <span className="dash">—</span>
                )}
              </td>

              <td>
                <StatusBadge
                  status={item.status}
                  statusClass={item.statusClass}
                />
              </td>

              <td className="actions">⋮</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function App() {
  return (
    <>
      <header className="topbar">
        <div className="logo">
          📦 Ewidencja<span>Sprzętu</span>
        </div>

        <div className="role">Rola: ADMIN</div>
      </header>

      <div className="layout">
        <Sidebar />

        <main className="main">
          <div className="heading-row">
            <div>
              <h1>Lista Sprzętu</h1>
              <p className="subtitle">
                Zarządzaj przedmiotami, statusami i przypisaniami w systemie.
              </p>
            </div>

            <button className="add-button">
              + Dodaj przedmiot
            </button>
          </div>

          <div className="filters">
            <div className="filter search">
              Szukaj po nr inwentarzowym, marce, modelu.
            </div>

            <div className="filter middle">
              Status: Wszystkie ▼
            </div>

            <div className="filter last">
              Przypisany: Wszyscy ▼
            </div>
          </div>

          <EquipmentTable />
        </main>
      </div>
    </>
  );
}

export default App;
