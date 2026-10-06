import StatusBadge from "./StatusBadge";

function EquipmentTable({ equipment }) {
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
              <td>{item.assigned ? (<span className="assigned">{item.assigned}</span>) : (<span className="dash">—</span>)}</td>
              <td>
                <StatusBadge status={item.status} statusClass={item.statusClass} />
              </td>
              <td className="actions">
                <button className="action-menu" type="button" aria-label={`Akcje dla ${item.inventory}`}> ⋮ </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default EquipmentTable;