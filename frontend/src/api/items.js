export async function getItems() {
  const response = await fetch('http://localhost:4000/api/items')

  if (!response.ok) {
    throw new Error('Nie udało się pobrać itemów')
  }

  return await response.json()
}

export async function getItemsWithDetails() {
  const response = await fetch('http://localhost:4000/api/items/details')

  if (!response.ok) {
    throw new Error('Nie udało się pobrać szczegółów sprzętu')
  }

  return await response.json()
}
