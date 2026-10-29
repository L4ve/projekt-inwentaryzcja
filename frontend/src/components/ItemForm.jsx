import { useState } from "react";
import { createItem, updateItem } from "../api/items";

const statuses = [
  ["1", "Aktywny"],
  ["2", "W naprawie"],
  ["3", "W magazynie"],
  ["4", "Wycofany"],
  ["5", "Zaginiony"],
];

function ItemForm({ item, locations, users, onSaved, onCancel }) {
  const [inventoryNumber, setInventoryNumber] = useState(item?.inventory_number || "");
  const [manufacturer, setManufacturer] = useState(item?.manufacturer || "");
  const [model, setModel] = useState(item?.model || "");
  const [purchaseDate, setPurchaseDate] = useState(item?.purchase_date || "");
  const [purchasePrice, setPurchasePrice] = useState(item?.purchase_price?.toString() || "");
  const [locationId, setLocationId] = useState(item?.location_id?.toString() || "");
  const [statusId, setStatusId] = useState(item?.status_id?.toString() || item?.status?.id?.toString() || "1");
  const [assignedTo, setAssignedTo] = useState(item?.assigned_to?.toString() || item?.assignedUser?.id?.toString() || "");
  const [error, setError] = useState("");

  function changeInventoryNumber(event) {
    setInventoryNumber(event.target.value);
  }

  function changeManufacturer(event) {
    setManufacturer(event.target.value);
  }

  function changeModel(event) {
    setModel(event.target.value);
  }

  async function handleSubmit(event) {
    event.preventDefault();

    try {
      const data = {
        inventory_number: inventoryNumber.trim(),
        manufacturer: manufacturer.trim() || null,
        model: model.trim() || null,
        purchase_date: purchaseDate || null,
        purchase_price: purchasePrice === "" ? null : Number(purchasePrice),
        location_id: locationId === "" ? null : Number(locationId),
        status_id: Number(statusId),
        assigned_to: assignedTo === "" ? null : Number(assignedTo),
      };
      if (item) {
        await updateItem(item.id, data);
      } else {
        await createItem(data);
      }
      onSaved();
    } catch (saveError) {
      setError(saveError.message);
    }
  }

  let errorMessage = null;
  if (error) {
    errorMessage = <p className="login-error">{error}</p>;
  }

  return (
    <form className="item-form" onSubmit={handleSubmit}>
      <input placeholder="Numer inwentarzowy" value={inventoryNumber} onChange={changeInventoryNumber} required maxLength="100" />
      <input placeholder="Producent" value={manufacturer} onChange={changeManufacturer} />
      <input placeholder="Model" value={model} onChange={changeModel} />
      <label>Data zakupu<input type="date" value={purchaseDate} onChange={(event) => setPurchaseDate(event.target.value)} /></label>
      <label>Cena<input type="number" min="0" step="0.01" value={purchasePrice} onChange={(event) => setPurchasePrice(event.target.value)} /></label>
      <label>Lokalizacja<select value={locationId} onChange={(event) => setLocationId(event.target.value)}>
        <option value="">Bez lokalizacji</option>
        {locations.map((location) => <option key={location.id} value={location.id}>{location.building}, {location.room}</option>)}
      </select></label>
      <label>Status<select value={statusId} onChange={(event) => setStatusId(event.target.value)}>
        {statuses.map(([id, name]) => <option key={id} value={id}>{name}</option>)}
      </select></label>
      <label>Przypisany do<select value={assignedTo} onChange={(event) => setAssignedTo(event.target.value)}>
        <option value="">Nikt</option>
        {users.map((user) => <option key={user.id} value={user.id}>{user.email}</option>)}
      </select></label>
      <button type="submit">{item ? "Zapisz zmiany" : "Zapisz"}</button>
      <button type="button" onClick={onCancel}>Anuluj</button>
      {errorMessage}
    </form>
  );
}

export default ItemForm;
