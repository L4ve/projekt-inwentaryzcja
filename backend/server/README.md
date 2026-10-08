# nigAPI

zajebiste poludniowe api (expresik + mysql) ktore zwraca liste sprzetu z bazy wow

1. odpal baze mysql inwentarz ok
2. w terminalu wpisz 'npm install' potem 'npm run dev' ok

potem poludniowe api wystartuje na `http://localhost:4000/api/items`

## Logowanie

Logowanie korzysta z `user.id` oraz `password_hash` z bazy. Endpointy sprzętu wymagają sesji:

- `POST /api/auth/login` - body: `{ "userId": 1, "password": "..." }`
- `GET /api/auth/me` - sprawdzenie aktywnej sesji
- `POST /api/auth/logout` - unieważnienie sesji

Sesja jest przechowywana w ciasteczku `HttpOnly`, a w tabeli `auth_session` zapisywany jest wyłącznie hash tokenu. Po aktualizacji serwera uruchom go ponownie, aby Sequelize utworzył tabelę sesji, jeśli nie została zaimportowana z `inventory_db.sql`.