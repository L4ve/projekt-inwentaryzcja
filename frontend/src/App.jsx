import { useEffect, useState } from "react";
import "./App.css";
import Sidebar from "./components/sidebar";
import Login from "./components/Login";
import Items from "./components/Items";
import AccessPage from "./pages/accessPage";
import { LogoIcon, LogoutIcon } from "./components/icons";

const API_URL = import.meta.env.VITE_API_URL ?? (import.meta.env.PROD ? "" : "http://localhost:4000");

function App() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("Wszystkie");
  const [assigned, setAssigned] = useState("Wszyscy");
  const [assignedUsers, setAssignedUsers] = useState([]);
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
    setActivePage("equipment");
  }

  if (!authChecked) {
    return <div className="auth-loading">Sprawdzanie sesji...</div>;
  }

  const role = user?.role || "user";

  function handleLogin(loggedUser) {
    setUser(loggedUser);
    setActivePage("equipment");
  }

  if (!user && activePage === "login") {
    return <Login apiUrl={API_URL} onLogin={handleLogin} onBack={() => setActivePage("equipment")} />;
  }

  return (
    <>
      <header className="topbar">
        <div className="logo">
          <LogoIcon className="logo-mark" />
          <span>Ewidencja Sprzętu</span>
        </div>
        <div className="session-actions">
          {user ? (
            <>
              <span className="role-badge" title={`Rola: ${role.toUpperCase()}`}>
                <span className="role-avatar" aria-hidden="true">{role.charAt(0).toUpperCase()}</span>
                <span className="role-text">
                  <span className="role-label">Rola</span>
                  <span className="role-name">{role.toUpperCase()}</span>
                </span>
              </span>
              <span className="session-divider" aria-hidden="true" />
              <button className="logout-button compact-on-mobile" type="button" onClick={handleLogout} aria-label="Wyloguj">
                <LogoutIcon />
                <span className="logout-text">Wyloguj</span>
              </button>
            </>
          ) : (
            <button className="logout-button" type="button" onClick={() => setActivePage("login")}>Panel logowania</button>
          )}
        </div>
      </header>
      <div className="layout">
        <Sidebar activePage={activePage} setActivePage={setActivePage} isAdmin={role === "admin"} />
        <main className="main">
          {activePage === "equipment" && (
            <Items
              role={role}
              search={search}
              onSearchChange={setSearch}
              statusFilter={status}
              onStatusFilterChange={setStatus}
              assignedFilter={assigned}
              onAssignedFilterChange={setAssigned}
              assignedUsers={assignedUsers}
              onAssignedUsersChange={setAssignedUsers}
            />
          )}

          {activePage === "logs" && (
            <h1>Logi</h1>
          )}

          {activePage === "access" && (
            role === "admin" ? <AccessPage apiUrl={API_URL} /> : <h1>Brak uprawnień</h1>
          )}
        </main>
      </div>
    </>
  );
}

export default App;
