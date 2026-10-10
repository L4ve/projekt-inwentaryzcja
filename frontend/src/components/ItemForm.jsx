import { useState } from "react";
import { createItem, updateItem } from "../api/items";

function ItemForm({ item, onSaved, onCancel }) {
  const [inventoryNumber, setInventoryNumber] = useState(item.inventory_number || "");
  const [manufacturer, setManufacturer] = useState(item.manufacturer || "");
  const [model, setModel] = useState(item.model || "");
  const [error, setError] = useState("");

  async function handleSubmit(event) {
    event.preventDefault();
    const data = { inventory_number: inventoryNumber, manufacturer, model };

    try {
      if (item.id) {
        await updateItem(item.id, data);
      } else {
        await createItem(data);
      }
      onSaved();
    } catch (saveError) {
      setError(saveError.message);
    }
  }

  return (
    <form className="item-form" onSubmit={handleSubmit}>
      <input placeholder="Numer inwentarzowy" value={inventoryNumber} onChange={(event) => setInventoryNumber(event.target.value)} required />
      <input placeholder="Producent" value={manufacturer} onChange={(event) => setManufacturer(event.target.value)} />
      <input placeholder="Model" value={model} onChange={(event) => setModel(event.target.value)} />
      <button type="submit">Zapisz</button>
      <button type="button" onClick={onCancel}>Anuluj</button>
      {error && <p className="login-error">{error}</p>}
    </form>
  );
}

export default ItemForm;
