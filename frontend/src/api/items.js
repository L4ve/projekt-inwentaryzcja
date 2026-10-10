const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

async function request(method, path, body) {
  const response = await fetch(`${API_URL}${path}`, {
    method,
    credentials: "include",
    headers: body ? { "Content-Type": "application/json" } : {},
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || "Coś poszło nie tak");
  }

  return data;
}

export const getItems = () => request("GET", "/api/items");
export const getItemsWithDetails = () => request("GET", "/api/items/details");
export const getLocations = () => request("GET", "/api/locations");
export const moveItem = (id, locationId) => request("PATCH", `/api/items/${id}/location`, { location_id: locationId });
export const createItem = (item) => request("POST", "/api/items", item);
export const updateItem = (id, item) => request("PATCH", `/api/items/${id}`, item);
export const deleteItem = (id) => request("DELETE", `/api/items/${id}`);
