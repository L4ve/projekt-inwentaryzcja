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
   FRONTEND_ORIGIN=http://localhost:5173
   ```

   `FRONTEND_ORIGIN` to adres frontendu, któremu backend zezwala na połączenie (domyślnie `http://localhost:5173`).

   Nie dodawaj pliku `.env` do repozytorium ani nie umieszczaj w nim haseł w dokumentacji.


## Uruchomienie

### Backend

```powershell
cd backend/server
npm install
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
npm run dev
```

Vite wyświetli adres lokalny, zazwyczaj:

```text
http://localhost:5173
```

Adres API frontend bierze ze zmiennej `VITE_API_URL` (domyślnie `http://localhost:4000`).

## Logowanie i role

Odczyt listy sprzętu jest publiczny. Zmiany wymagają zalogowania i odpowiedniej roli.

| Rola | `id` roli | Uprawnienia |
| --- | --- | --- |
| niezalogowany lub `user` | — / `3` | Tylko podgląd listy sprzętu |
| `manager` (moderator) | `2` | Podgląd oraz przenoszenie sprzętu (zmiana lokalizacji) |
| `admin` | `1` | Wszystko: przenoszenie, dodawanie, edycja i usuwanie sprzętu |

Rola użytkownika jest zapisana w tabeli `user` (`role_id`). Panel do zarządzania użytkownikami jeszcze nie istnieje.

Plik `inventory_db.sql` tworzy trzy konta testowe (użytkownicy o `id` 1, 2 i 3, wspólne hasło `haslo123`). Są przeznaczone tylko do rozwoju, nie używaj ich w produkcji.

Logowanie odbywa się po `id` użytkownika i haśle. Sesja jest zapisywana w ciasteczku `HttpOnly` i trwa 8 godzin. Po 5 nieudanych próbach logowania adres IP jest blokowany na 15 minut.

## API

Base URL:

```text
http://localhost:4000
```

### Status API

```http
GET /api/status
```

Dostęp: wszyscy. Odpowiedź:

```json
{
  "status": "ok",
  "message": "API działa"
}
```

### Logowanie

```http
POST /api/auth/login
Content-Type: application/json
```

Przykładowe żądanie:

```json
{
  "userId": 1,
  "password": "haslo123"
}
```

Poprawne logowanie zwraca `200 OK`, ustawia ciasteczko sesji i zwraca użytkownika:

```json
{
  "user": {
    "id": 1,
    "role": "admin"
  }
}
```

Możliwe błędy:

- `401 Unauthorized` — nieprawidłowy identyfikator lub hasło,
- `429 Too Many Requests` — zbyt wiele nieudanych prób logowania.

### Sprawdzenie sesji

```http
GET /api/auth/me
```

Dostęp: zalogowani. Zwraca użytkownika w takim samym formacie jak logowanie, a bez sesji `401 Unauthorized`.

### Wylogowanie

```http
POST /api/auth/logout
```

Unieważnia sesję i zwraca `204 No Content`.

### Pobranie wszystkich elementów

```http
GET /api/items
```

Dostęp: wszyscy (bez logowania).

### Pobranie elementów wraz ze szczegółami

```http
GET /api/items/details
```

Dostęp: wszyscy (bez logowania). Zamiast `location_id`, `status_id` i `assigned_to` zwraca obiekty `location`, `status` i `assignedUser` (lub `null`, gdy brak):

```json
[
  {
    "id": 1,
    "inventory_number": "INV-2024-001",
    "manufacturer": "Dell",
    "model": "Latitude 5540",
    "purchase_date": "2024-03-12",
    "purchase_price": "4899.00",
    "status": { "id": 1, "name": "active" },
    "location": { "id": 1, "building": "Budynek A", "room": "101" },
    "assignedUser": { "id": 3, "role_id": 3 }
  }
]
```

### Pobranie lokalizacji

```http
GET /api/locations
```

Dostęp: wszyscy (bez logowania). Odpowiedź:

```json
[
  { "id": 1, "building": "Budynek A", "room": "101" }
]
```

### Pobranie elementu po ID

```http
GET /api/items/:id
```

Dostęp: wszyscy (bez logowania).

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

Dostęp: tylko `admin`.

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

Dostęp: tylko `admin`.

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

Dostęp: tylko `admin`.

Odpowiedź:

```json
{
  "message": "Item deleted"
}
```

### Przeniesienie elementu

```http
PATCH /api/items/:id/location
Content-Type: application/json
```

Dostęp: `admin` oraz `manager`.

Przykład:

```json
{
  "location_id": 2
}
```

Odpowiedź:

```json
{
  "message": "Item moved"
}
```

`location_id` musi wskazywać istniejącą lokalizację, w przeciwnym razie serwer zwróci `500`.

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
- `session` (tworzona automatycznie przy starcie serwera, przechowuje sesje logowania; tabela `auth_session` z pliku SQL nie jest używana),
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
| `401` | Wymagane logowanie |
| `403` | Brak uprawnień (rola nie pozwala na tę operację) |
| `404` | Element nie istnieje |
| `409` | Konflikt unikalnego numeru inwentarzowego |
| `413` | Zbyt duże żądanie (powyżej 10 kB) |
| `429` | Zbyt wiele nieudanych prób logowania |
| `500` | Błąd serwera lub bazy danych |
