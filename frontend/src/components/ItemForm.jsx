import { useState } from "react";
import { createItem } from "../api/items";

function ItemForm({ onSaved, onCancel }) {
  const [inventoryNumber, setInventoryNumber] = useState("");
  const [manufacturer, setManufacturer] = useState("");
  const [model, setModel] = useState("");
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
      await createItem({ inventory_number: inventoryNumber, manufacturer, model });
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
      <input placeholder="Numer inwentarzowy" value={inventoryNumber} onChange={changeInventoryNumber} required />
      <input placeholder="Producent" value={manufacturer} onChange={changeManufacturer} />
      <input placeholder="Model" value={model} onChange={changeModel} />
      <button type="submit">Zapisz</button>
      <button type="button" onClick={onCancel}>Anuluj</button>
      {errorMessage}
    </form>
  );
}

export default ItemForm;
