function NavItem({ page, activePage, setActivePage, icon, children }) {
  const isActive = activePage === page;

  return (
    <button
      className={isActive ? "nav-link active d-flex align-items-center gap-2" : "nav-link d-flex align-items-center gap-2"}
      type="button"
      aria-current={isActive ? "page" : undefined}
      onClick={() => setActivePage(page)}
    >
      <i className={`bi ${icon}`} />
      {children}
    </button>
  );
}

function Sidebar({ activePage, setActivePage, isAdmin, isOpen }) {
  return (
    <nav className={`sidebar${isOpen ? " open" : ""} nav nav-pills flex-row flex-xl-column flex-nowrap gap-1 p-2 p-xl-3 bg-white border-end overflow-auto`} aria-label="Nawigacja">
      <NavItem page="equipment" activePage={activePage} setActivePage={setActivePage} icon="bi-table">
        Sprzęt
      </NavItem>
      <NavItem page="logs" activePage={activePage} setActivePage={setActivePage} icon="bi-list-ul">
        Logi
      </NavItem>
      {isAdmin && (
        <NavItem page="access" activePage={activePage} setActivePage={setActivePage} icon="bi-key">
          Zarządzanie Dostępem
        </NavItem>
      )}
    </nav>
  );
}

export default Sidebar;
