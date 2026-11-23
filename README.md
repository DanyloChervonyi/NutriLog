# NutriLog

NutriLog is a nutrition tracking platform. Product requirements and the data model are documented in `docs/`.

## Repository layout

- `apps/web` - Next.js App Router client (TypeScript)
- `apps/api` - NestJS REST API (TypeScript)
- `docs` - product specification and database diagrams

## Запуск проекта

Требования: Node.js `>=22.12`, pnpm `10.33.0` и Docker Desktop.

### Первый запуск

Из корня репозитория:

```powershell
Copy-Item .env.example .env
pnpm install
docker compose up -d postgres redis
pnpm --filter @nutrilog/api db:generate
pnpm --filter @nutrilog/api db:migrate
```

Перед запуском откройте `.env` и замените секреты. Пароль PostgreSQL должен совпадать в `POSTGRES_PASSWORD` и `DATABASE_URL`, пароль Redis — в `REDIS_PASSWORD` и `REDIS_URL`. Для локальных случайных секретов удобно использовать длинные hex-строки.

### Разработка

Запустить API и веб-клиент одновременно одной командой:

```powershell
pnpm dev
```

Скрипт использует свободный порт в диапазоне `3000–3020` и выводит адрес веб-клиента. Остановить оба процесса можно через `Ctrl+C`.

Если нужно запускать их независимо, используйте две команды в отдельных терминалах:

```powershell
pnpm dev:api
```

```powershell
pnpm dev:web
```

API доступен на `http://localhost:4000`. В development API разрешает адреса Next.js на `localhost` и `127.0.0.1` в диапазоне портов `3000–3020`, поэтому смена свободного порта не требует менять CORS вручную. Если запускаете web и API раздельно и порт web отличается от `3000`, задайте `WEB_ORIGIN` перед запуском API: он также используется для возврата после Google OAuth и формирования ссылок сброса пароля. В production разрешён только адрес из `WEB_ORIGIN`.

Проверка API: `http://localhost:4000/api/v1/health`. Документация Swagger: `http://localhost:4000/api/docs`.
Пошаговые запросы для Postman и Thunder Client: [docs/API-TESTING.md](docs/API-TESTING.md).

### Локальные аккаунты администратора

После применения миграций можно создать два локальных аккаунта администратора. Команда удаляет **всех текущих пользователей** вместе с профилями, дневниками, сессиями и токенами; продукты каталога сохраняются. Скрипт запрещён при `NODE_ENV=production` и требует явного подтверждения.

Укажите в локальном `.env` значения `SEED_DEBUG_ADMIN_PASSWORD`, `SEED_DICTATOR_EMAIL` и `SEED_DICTATOR_PASSWORD`, затем выполните из PowerShell в корне проекта:

```powershell
$env:RESET_USERS = 'true'
pnpm --filter @nutrilog/api db:reset-users-and-seed
Remove-Item Env:RESET_USERS
```

Первый аккаунт имеет ник `admin` и использует значение `SEED_DEBUG_ADMIN_PASSWORD`; второй — ник `diktator` и использует заданные email и пароль. Пароли хешируются Argon2id. Не запускайте команду на базе с нужными данными.

## Security baseline

- Secret-bearing `.env` files are ignored by Git; only `.env.example` is tracked.
- API responses use Helmet security headers, strict CORS origins, request validation, and global rate limiting.
- The web app disables its framework signature and sets browser security headers. HSTS is sent only in production.
- Passwords, tokens, and database credentials must never be committed.

## MVP scope

See [docs/MVP-SCOPE.md](docs/MVP-SCOPE.md) for the agreed first release scope and completion criteria.
