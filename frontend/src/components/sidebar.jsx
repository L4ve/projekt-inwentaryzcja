import { useEffect, useRef } from "react";
import { KeyIcon, ListIcon, TableIcon } from "./icons";

function NavItem({ page, activePage, setActivePage, icon, children }) {
  const isActive = activePage === page;
  const buttonRef = useRef(null);

  useEffect(() => {
    if (isActive) {
      buttonRef.current?.scrollIntoView({ block: "nearest", inline: "nearest" });
    }
  }, [isActive]);

  return (
    <button
      ref={buttonRef}
      className={isActive ? "nav-item active" : "nav-item"}
      type="button"
      aria-current={isActive ? "page" : undefined}
      onClick={() => setActivePage(page)}
    >
      {icon}
      <span>{children}</span>
    </button>
  );
}

function Sidebar({ activePage, setActivePage, isAdmin }) {
  return (
    <nav className="sidebar" aria-label="Nawigacja">
      <NavItem page="equipment" activePage={activePage} setActivePage={setActivePage} icon={<TableIcon />}>
        Ewidencja Sprzętu
      </NavItem>
      <NavItem page="logs" activePage={activePage} setActivePage={setActivePage} icon={<ListIcon />}>
        Logi
      </NavItem>
      {isAdmin && (
        <NavItem page="access" activePage={activePage} setActivePage={setActivePage} icon={<KeyIcon />}>
          Zarządzanie Dostępem
        </NavItem>
      )}
    </nav>
  );
}

export default Sidebar;
