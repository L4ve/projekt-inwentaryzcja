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

Adres API frontend bierze ze zmiennej `VITE_API_URL` (domyślnie `http://localhost:4000`).

## Struktura backendu

Kod w `backend/server/` jest podzielony tak, że jedna funkcjonalność to jeden plik:

```
backend/server/
├── index.js              # start serwera: middleware i podpięcie tras
├── config.js             # wczytanie .env, stałe (cookie, tryb produkcyjny)
├── db.js                 # połączenie z bazą (Sequelize)
├── models/               # po jednym pliku na tabelę
│   ├── Item.js, ItemStatus.js, Location.js
│   ├── User.js, UserRole.js, Session.js
│   └── index.js          # powiązania między modelami (belongsTo)
├── middleware/
│   └── auth.js           # requireAuth, onlyAdmin, adminOrManager, canLogIn
├── routes/               # po jednym pliku na grupę endpointów
│   ├── auth.js           # /api/auth (login, me, logout)
│   ├── users.js          # /api/admin (użytkownicy i role)
│   ├── items.js          # /api/items (CRUD sprzętu, szczegóły, przenoszenie)
│   └── locations.js      # /api/locations
└── utils/
    ├── validation.js     # walidacja e-maila, ID i danych sprzętu
    ├── session.js        # tworzenie sesji i obsługa ciasteczka
    └── loginLimit.js     # limit prób logowania
```

## Logowanie i role

Aby korzystać z aplikacji, trzeba się zalogować (po adresie email i haśle). Logować się mogą tylko `admin` i `manager`. Konta zakłada wyłącznie `admin`, nie ma samodzielnej rejestracji. Uprawnienia zależą od roli użytkownika:

| Rola | `id` roli | Uprawnienia |
| --- | --- | --- |
| `manager` (moderator) | `2` | Podgląd listy sprzętu oraz przenoszenie sprzętu (zmiana lokalizacji) |
| `admin` | `1` | Wszystko: przenoszenie, dodawanie, edycja i usuwanie sprzętu oraz zarządzanie kontami i rolami |
| `user` | `3` | Brak możliwości logowania (konto z tą rolą dostaje `403`) |

W aplikacji moderator i admin przenoszą sprzęt listą w kolumnie „Przenieś do”. Admin dodaje sprzęt przyciskiem „Dodaj sprzęt”, edytuje go przyciskiem „Edytuj”, a konta użytkowników zakłada w zakładce „Zarządzanie Dostępem”. Tabelę można przeszukiwać, filtrować po statusie oraz roli przypisanego użytkownika i sortować (rosnąco) po numerze inwentarzowym, producencie lub modelu. Uprawnienia są sprawdzane po stronie backendu, więc osoba bez odpowiedniej roli dostaje błąd `403`, nawet gdy wywoła API bezpośrednio.

Rola użytkownika jest zapisana w tabeli `user` (`role_id`). Plik `inventory_db.sql` tworzy trzy konta testowe ze wspólnym hasłem `haslo123`, przeznaczone tylko do rozwoju:

| Email | Rola |
| --- | --- |
| `admin@example.com` | `admin` |
| `manager@example.com` | `manager` |
| `user@example.com` | `user` |

## API

Base URL:

```text
http://localhost:4000
```

### Status API

```http
GET /api/status
```

Dostęp: bez logowania. Odpowiedź:

```json
{
  "status": "ok",
  "message": "API działa"
}
```

Pozostałe endpointy, poza logowaniem, wymagają zalogowania. Bez sesji zwracają `401 Unauthorized`.

### Logowanie

```http
POST /api/auth/login
Content-Type: application/json
```

Przykładowe żądanie:

```json
{
  "email": "admin@example.com",
  "password": "haslo123"
}
```

Poprawne logowanie ustawia ciasteczko sesji i zwraca użytkownika wraz z rolą:

```json
{
  "user": {
    "id": 1,
    "role": "admin"
  }
}
```

Możliwe błędy:

- `401 Unauthorized` — nieprawidłowy email lub hasło,
- `403 Forbidden` — konto ma rolę `user` i nie może się logować,
- `429 Too Many Requests` — zbyt wiele nieudanych prób logowania.

### Sprawdzenie sesji

```http
GET /api/auth/me
```

Dostęp: zalogowani. Zwraca użytkownika w takim samym formacie jak logowanie. Bez sesji zwraca `401 Unauthorized`.

### Wylogowanie

```http
POST /api/auth/logout
```

Kończy sesję i zwraca `204 No Content`.

### Pobranie wszystkich elementów

```http
GET /api/items
```

Dostęp: każdy zalogowany użytkownik.

### Pobranie elementów wraz ze szczegółami

```http
GET /api/items/details
```

Dostęp: każdy zalogowany użytkownik. Oprócz pól sprzętu (łącznie z `location_id`, `status_id` i `assigned_to`) zwraca obiekty `status`, `location` i `assignedUser` (lub `null`, gdy brak):

```json
[
  {
    "id": 1,
    "inventory_number": "INV-2024-001",
    "manufacturer": "Dell",
    "model": "Latitude 5540",
    "purchase_date": "2024-03-12",
    "purchase_price": "4899.00",
    "location_id": 1,
    "status_id": 1,
    "assigned_to": 3,
    "status": { "id": 1, "name": "active" },
    "location": { "id": 1, "building": "Budynek A", "room": "101" },
    "assignedUser": { "id": 3, "email": "user@example.com", "role_id": 3, "UserRole": { "role": "user" } }
  }
]
```

### Pobranie lokalizacji

```http
GET /api/locations
```

Dostęp: każdy zalogowany użytkownik. Zwraca listę lokalizacji:

```json
[
  { "id": 1, "building": "Budynek A", "room": "101" }
]
```

### Pobranie elementu po ID

```http
GET /api/items/:id
```

Dostęp: każdy zalogowany użytkownik.

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
  "purchase_price": 4899,
  "location_id": 1,
  "status_id": 1,
  "assigned_to": 3
}
```

Możliwe błędy:

- `400 Bad Request` — brak lub nieprawidłowy numer inwentarzowy albo nieprawidłowa cena,
- `409 Conflict` — numer inwentarzowy już istnieje,
- `500 Internal Server Error` — błąd serwera lub bazy danych (także wtedy, gdy `status_id` lub `location_id` wskazuje nieistniejący rekord).

### Aktualizacja elementu

```http
PATCH /api/items/:id
Content-Type: application/json
```

Dostęp: tylko `admin`.

Endpoint wymaga pełnego zestawu pól (jak przy dodawaniu, w tym `inventory_number`). Częściowa aktualizacja nie jest obsługiwana i zwraca `400`.

Przykład:

```json
{
  "inventory_number": "INV-2026-003",
  "manufacturer": "Dell",
  "model": "Latitude 5540",
  "purchase_date": "2026-01-15",
  "purchase_price": 4500.00,
  "location_id": 2,
  "status_id": 1,
  "assigned_to": 3
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

Odpowiedź zawiera komunikat i zaktualizowany rekord:

```json
{
  "message": "Item updated",
  "item": {
    "id": 6,
    "inventory_number": "INV-2026-003",
    "manufacturer": "Dell",
    "model": "Latitude 5540",
    "purchase_date": "2026-01-15",
    "purchase_price": 4500,
    "location_id": 2,
    "status_id": 1,
    "assigned_to": 3
  }
}
```

Możliwe błędy:

- `400 Bad Request` — nieprawidłowe dane, w tym brak numeru inwentarzowego,
- `404 Not Found` — element nie istnieje,
- `409 Conflict` — numer inwentarzowy już istnieje.

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

### Lista użytkowników

```http
GET /api/admin/users
```

Dostęp: tylko `admin`. Odpowiedź:

```json
[
  { "id": 1, "email": "admin@example.com", "roleId": 1, "role": "admin" }
]
```

### Lista ról

```http
GET /api/admin/roles
```

Dostęp: tylko `admin`. Zwraca role, które można przypisać użytkownikom:

```json
[
  { "id": 1, "role": "admin" },
  { "id": 2, "role": "manager" },
  { "id": 3, "role": "user" }
]
```

### Dodanie użytkownika

```http
POST /api/admin/users
Content-Type: application/json
```

Dostęp: tylko `admin`. To jedyny sposób zakładania kont.

Przykładowe żądanie:

```json
{
  "email": "nowy@example.com",
  "password": "dlugiehaslo12345",
  "roleId": 2
}
```

Hasło musi mieć od 12 do 128 znaków. Poprawne utworzenie zwraca `201 Created` oraz użytkownika:

```json
{
  "id": 4,
  "email": "nowy@example.com",
  "roleId": 2,
  "role": "manager"
}
```

Możliwe błędy:

- `400 Bad Request` — nieprawidłowy email, hasło lub rola,
- `409 Conflict` — adres email jest już zajęty.

### Zmiana roli użytkownika

```http
PATCH /api/admin/users/:id
Content-Type: application/json
```

Dostęp: tylko `admin`.

Przykład:

```json
{
  "roleId": 3
}
```

Odpowiedź:

```json
{
  "message": "Rola została zmieniona."
}
```

Admin nie może odebrać sobie roli `admin`, a system musi mieć co najmniej jednego admina (w obu przypadkach `400 Bad Request`). Użytkownik, któremu zmieniono rolę na `user`, traci aktywną sesję.

### Usunięcie użytkownika

```http
DELETE /api/admin/users/:id
```

Dostęp: tylko `admin`. Poprawne usunięcie zwraca `204 No Content`. Admin nie może usunąć własnego konta ani ostatniego admina (`400 Bad Request`), a nieistniejący użytkownik daje `404 Not Found`.

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
- `user` (z unikalnym adresem `email`),
- `auth_session` (aktywne sesje logowania),
- `item_status`,
- `location`,
- `audit_action`,
- `audit_log`.

## Statusy HTTP

| Status | Znaczenie |
| --- | --- |
| `200` | Żądanie wykonane poprawnie |
| `201` | Rekord utworzony |
| `204` | Operacja wykonana, brak treści w odpowiedzi |
| `400` | Nieprawidłowe dane wejściowe |
| `401` | Wymagane logowanie |
| `403` | Brak uprawnień (rola nie pozwala na tę operację) |
| `404` | Element nie istnieje |
| `409` | Konflikt unikalnego numeru inwentarzowego |
| `429` | Zbyt wiele nieudanych prób logowania |
| `500` | Błąd serwera lub bazy danych |
