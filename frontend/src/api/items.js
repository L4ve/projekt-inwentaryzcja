const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

export async function getItems() {
  const response = await fetch(`${API_URL}/api/items`, {
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error('Nie udało się pobrać itemów');
  }

  return await response.json();
}

export async function getItemsWithDetails() {
  const response = await fetch(`${API_URL}/api/items/details`, {
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error('Nie udało się pobrać szczegółów sprzętu');
  }

  return await response.json();
}

export async function getLocations() {
  const response = await fetch(`${API_URL}/api/locations`, {
    credentials: "include",
  });

  if (!response.ok) {
    throw new Error('Nie udało się pobrać lokalizacji');
  }

  return await response.json();
}

export async function getUsers() {
  const response = await fetch(`${API_URL}/api/admin/users`, {
    credentials: "include",
  });
  if (!response.ok) {
    throw new Error("Nie udało się pobrać użytkowników");
  }
  return response.json();
}

async function send(method, path, body) {
  const response = await fetch(`${API_URL}${path}`, {
    method,
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || 'Coś poszło nie tak');
  }

  return data;
}

export function moveItem(id, locationId) {
  return send("PATCH", `/api/items/${id}/location`, { location_id: locationId });
}

export function createItem(item) {
  return send("POST", "/api/items", item);
}

export function updateItem(id, item) {
  return send("PATCH", `/api/items/${id}`, item);
}
