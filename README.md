# Projekt inwentaryzacji

Prosta aplikacja do ewidencji sprzętu.

## Specyfikacja

- Frontend: React + Vite
- Backend: Node.js + Express, MySQL, XAMPP

## Wymagania

- Node.js,
- npm,
- XAMPP.

## Instalacja

Zależności instaluje się osobno dla backendu i frontendu:

```powershell
cd backend/server
npm install

cd ../../frontend
npm install
```

## Konfiguracja bazy danych

1. Uruchom moduł MySQL w XAMPP.
2. Zaimportuj plik [`backend/inventory_db.sql`](./backend/inventory_db.sql) w phpMyAdmin
3. Utwórz plik `backend/server/.env`:

   ```env
   DB_NAME=inwentarz
   DB_USER=root
   DB_PASSWORD=
   DB_HOST=127.0.0.1
   ```

   Nie dodawaj pliku `.env` do repozytorium ani nie umieszczaj w nim haseł w dokumentacji.


## Uruchomienie

### Backend

```powershell
cd backend/server
npm install
npm install sequelize
npm run dev
```

API będzie dostępne pod adresem:

```text
http://localhost:4000
```

Obecna konfiguracja serwera korzysta ze stałego portu `4000`.

### Frontend

W drugim terminalu:

```powershell
cd frontend
npm install
npm install vite
npm run dev
```

Vite wyświetli adres lokalny, zazwyczaj:

```text
http://localhost:5173
```

## API

Base URL:

```text
http://localhost:4000
```

### Pobranie wszystkich elementów

```http
GET /api/items
```

### Pobranie elementu po ID

```http
GET /api/items/:id
```

Jeśli element nie istnieje:

```json
{
  "error": "Item not found"
}
```

### Dodanie elementu

```http
POST /api/items
Content-Type: application/json
```

Przykładowe żądanie:

```json
{
  "inventory_number": "INV-2026-003",
  "manufacturer": "Dell",
  "model": "Latitude 5540",
  "purchase_date": "2026-01-15",
  "purchase_price": 4899.00,
  "location_id": 1,
  "status_id": 1,
  "assigned_to": 3
}
```

`inventory_number` jest wymagany. Pozostałe pola są opcjonalne i domyślnie otrzymują wartość `null`; `status_id` domyślnie przyjmuje `1`.

Poprawne utworzenie elementu zwraca `201 Created` oraz zapisany rekord:

```json
{
  "id": 6,
  "inventory_number": "INV-2026-003",
  "manufacturer": "Dell",
  "model": "Latitude 5540",
  "purchase_date": "2026-01-15",
  "purchase_price": "4899.00",
  "location_id": 1,
  "status_id": 1,
  "assigned_to": 3
}
```

Możliwe błędy:

- `400 Bad Request` — brak numeru inwentarzowego albo nieprawidłowa cena,
- `409 Conflict` — numer inwentarzowy już istnieje,
- `500 Internal Server Error` — błąd serwera lub bazy danych.

### Aktualizacja elementu

```http
PATCH /api/items/:id
Content-Type: application/json
```

Przykład:

```json
{
  "purchase_price": 4500.00,
  "location_id": 2,
  "status_id": 1
}
```

Endpoint obsługuje pola:

```text
inventory_number
manufacturer
model
purchase_date
purchase_price
location_id
status_id
assigned_to
```

Odpowiedź:

```json
{
  "message": "Item updated"
}
```

### Usunięcie elementu

```http
DELETE /api/items/:id
```

Odpowiedź:

```json
{
  "message": "Item deleted"
}
```

## Model danych

Główna tabela `item` zawiera:

| Pole | Typ | Opis |
| --- | --- | --- |
| `id` | `INT` | Klucz główny |
| `inventory_number` | `VARCHAR(100)` | Unikalny numer inwentarzowy |
| `manufacturer` | `VARCHAR(100)` | Producent |
| `model` | `VARCHAR(100)` | Model |
| `purchase_date` | `DATE` | Data zakupu |
| `purchase_price` | `DECIMAL(10,2)` | Cena zakupu |
| `location_id` | `INT` | Odwołanie do `location` |
| `status_id` | `INT` | Odwołanie do `item_status` |
| `assigned_to` | `INT` | Odwołanie do `user` |

W bazie znajdują się również tabele:

- `user_role`,
- `user`,
- `item_status`,
- `location`,
- `audit_action`,
- `audit_log`.

## Statusy HTTP

| Status | Znaczenie |
| --- | --- |
| `200` | Żądanie wykonane poprawnie |
| `201` | Rekord utworzony |
| `400` | Nieprawidłowe dane wejściowe |
| `404` | Element nie istnieje |
| `409` | Konflikt unikalnego numeru inwentarzowego |
| `500` | Błąd serwera lub bazy danych |
