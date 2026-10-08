import { useEffect, useState } from "react";
import "./App.css";
import Sidebar from "./components/sidebar";
import EquipmentTable from "./components/EquipmentTable";
import Login from "./components/Login";
import { equipment } from "./data/equipment";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

function App() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("Wszystkie");
  const [assigned, setAssigned] = useState("Wszyscy");
  const [activePage, setActivePage] = useState("equipment");
  const [user, setUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    fetch(`${API_URL}/api/auth/me`, { credentials: "include" })
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => setUser(data?.user || null))
      .catch(() => setUser(null))
      .finally(() => setAuthChecked(true));
  }, []);

  async function handleLogout() {
    await fetch(`${API_URL}/api/auth/logout`, {
      method: "POST",
      credentials: "include",
    });
    setUser(null);
  }

  if (!authChecked) {
    return <div className="auth-loading">Sprawdzanie sesji...</div>;
  }

  if (!user) {
    return <Login apiUrl={API_URL} onLogin={setUser} />;
  }

  return (
    <>
      <header className="topbar">
        <div className="logo">
          📦 Ewidencja <span>Sprzętu</span>
        </div>
        <div className="session-actions">
          <span className="role-badge">Rola: {user.role.toUpperCase()}</span>
          <button className="logout-button" type="button" onClick={handleLogout}>Wyloguj</button>
        </div>
      </header>
      <div className="layout">
        <Sidebar setActivePage={setActivePage} />
        <main className="main"> {activePage === "equipment" && 
        ( <>
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
              <EquipmentTable equipment={equipment} />
            </>
          )}

          {activePage === "logs" && (
            <h1>Logi</h1>
          )}

          {activePage === "access" && (
            <h1>Zarządzanie Dostępem</h1>
          )}
        </main>
      </div>
    </>
  );
}

export default App;