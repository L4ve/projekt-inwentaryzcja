import { useEffect, useState } from "react";
import "./App.css";
import Sidebar from "./components/sidebar";
import Login from "./components/Login";
import Items from "./components/Items";
import AccessPage from "./pages/accessPage";

const API_URL = import.meta.env.VITE_API_URL ?? (import.meta.env.PROD ? "" : "http://localhost:4000");

function App() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("Wszystkie");
  const [assigned, setAssigned] = useState("Wszyscy");
  const [assignedUsers, setAssignedUsers] = useState([]);
  const [activePage, setActivePage] = useState("equipment");
  const [user, setUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

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
    goToPage("equipment");
  }

  function goToPage(page) {
    setActivePage(page);
    setMenuOpen(false);
  }

  if (!authChecked) {
    return <div className="min-vh-100 d-flex align-items-center justify-content-center text-secondary">Sprawdzanie sesji...</div>;
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
      <header className="topbar sticky-top d-flex align-items-center justify-content-between gap-3 px-3 px-md-4 bg-white border-bottom">
        <div className="d-flex align-items-center gap-2 fw-semibold text-nowrap">
          <i className="bi bi-box-seam text-primary fs-5" />
          <span>Ewidencja Sprzętu</span>
        </div>
        <div className="d-flex align-items-center gap-3">
          {user ? (
            <>
              <div className="d-flex align-items-center gap-2" title={`Rola: ${role.toUpperCase()}`}>
                <span className="avatar rounded-circle bg-primary text-white d-inline-flex align-items-center justify-content-center">
                  {role.charAt(0).toUpperCase()}
                </span>
                <div className="lh-sm d-none d-md-block">
                  <div className="small text-secondary">Rola</div>
                  <div className="small fw-semibold">{role.toUpperCase()}</div>
                </div>
              </div>
              <div className="vr d-none d-md-block" />
              <button className="btn btn-outline-secondary btn-sm d-flex align-items-center gap-2" type="button" onClick={handleLogout} aria-label="Wyloguj">
                <i className="bi bi-box-arrow-right" />
                <span className="d-none d-sm-inline">Wyloguj</span>
              </button>
            </>
          ) : (
            <button className="btn btn-outline-secondary btn-sm d-flex align-items-center gap-2" type="button" onClick={() => goToPage("login")} aria-label="Panel logowania">
              <i className="bi bi-box-arrow-in-right d-sm-none" />
              <span className="d-none d-sm-inline">Panel logowania</span>
            </button>
          )}
          {user && (
            <button className="btn btn-outline-secondary btn-sm d-sm-none" type="button" onClick={() => setMenuOpen(!menuOpen)} aria-label="Menu" aria-expanded={menuOpen}>
              <i className={menuOpen ? "bi bi-x-lg" : "bi bi-list"} />
            </button>
          )}
        </div>
      </header>
      {menuOpen && <div className="menu-backdrop d-sm-none" onClick={() => setMenuOpen(false)} />}
      <div className="d-flex flex-column flex-xl-row flex-grow-1">
        {user && <Sidebar activePage={activePage} setActivePage={goToPage} isAdmin={role === "admin"} isOpen={menuOpen} />}
        <main className="main flex-grow-1 p-3 p-md-4">
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
            user ? <h1 className="h4 fw-semibold mb-3">Logi</h1> : <h1 className="h4 fw-semibold mb-3">Brak uprawnień</h1>
          )}

          {activePage === "access" && (
            role === "admin" ? <AccessPage apiUrl={API_URL} /> : <h1 className="h4 fw-semibold mb-3">Brak uprawnień</h1>
          )}
        </main>
      </div>
    </>
  );
}

export default App;
