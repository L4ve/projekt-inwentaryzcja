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

export default Sidebar;