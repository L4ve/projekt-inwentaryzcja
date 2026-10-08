import { useState } from "react";
import "./App.css";
import Sidebar from "./components/sidebar";
import Items from "./components/Items";

function App() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("Wszystkie");
  const [assigned, setAssigned] = useState("Wszyscy");
  const [activePage, setActivePage] = useState("equipment");

  return (
    <>
      <header className="topbar">
        <div className="logo">
          📦 Ewidencja <span>Sprzętu</span>
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
              <Items/>
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