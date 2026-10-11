# Inventory API

Express + MySQL API for the inventory application.

1. Import `../inventory_db.sql` into MySQL.
2. Configure `DB_NAME`, `DB_USER`, `DB_PASSWORD`, `DB_HOST` and `FRONTEND_ORIGIN` in `.env`.
3. Run `npm install`, then `npm run dev`.

The API starts at `http://localhost:4000`.

## Logowanie

Logowanie uses the unique `user.email` and a bcrypt `password_hash`:

- `POST /api/auth/login` - body: `{ "email": "admin@example.com", "password": "..." }`
- `POST /api/auth/register` - body: `{ "email": "new@example.com", "password": "..." }`;
  new users always receive the `user` role and are not logged in automatically
- `GET /api/auth/me` - sprawdzenie aktywnej sesji
- `POST /api/auth/logout` - unieważnienie sesji

The session is stored in an HttpOnly cookie, while only its hash is stored in
the `auth_session` table. Admin endpoints allow listing, creating, deleting and
changing roles of users. Only administrators can use them.

The database schema in `inventory_db.sql` must be imported before starting the
server. Existing databases need a migration for the unique `user.email` field.