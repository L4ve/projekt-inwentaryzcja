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