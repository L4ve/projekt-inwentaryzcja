import { useState } from "react";
import EquipmentTable from "./components/EquipmentTable";
import { equipment } from "./data/equipment";



function EquipmentPage() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("Wszystkie");
  const [assigned, setAssigned] = useState("Wszyscy");

  return (
    <>
      <div className="heading-row">
        <div className="filters">
          <input type="text" placeholder="Szukaj po nr inwentarzowym, marce, modelu." value={search} onChange={(e) => setSearch(e.target.value)}/>
        </div>
        <div className="status-filter">
          <select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="Wszystkie">Status: Wszystkie</option>
            <option value="Aktywny">Status: Aktywny</option>
            <option value="Nieaktywny">Status: Nieaktywny</option>
            <option value="Wydany">Status: Wydany</option>
            <option value="Uszkodzony">Status: Uszkodzony</option>
          </select>
        </div>

        <div className="assigned-filter">
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
  );
}

export default EquipmentPage;