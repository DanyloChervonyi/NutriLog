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

API доступен на `http://localhost:4000`. При совместном запуске скрипт сам настраивает CORS для выбранного адреса фронтенда. При раздельном запуске веб-клиент использует `localhost`; если порт `3000` занят и Next.js выбрал другой, задайте этот адрес в `WEB_ORIGIN` перед запуском API. Например, в PowerShell для порта `3001`: `$env:WEB_ORIGIN='http://localhost:3001'`.

Проверка API: `http://localhost:4000/api/v1/health`. Документация Swagger: `http://localhost:4000/api/docs`.

## Security baseline

- Secret-bearing `.env` files are ignored by Git; only `.env.example` is tracked.
- API responses use Helmet security headers, strict CORS origins, request validation, and global rate limiting.
- The web app disables its framework signature and sets browser security headers. HSTS is sent only in production.
- Passwords, tokens, and database credentials must never be committed.

## MVP scope

See [docs/MVP-SCOPE.md](docs/MVP-SCOPE.md) for the agreed first release scope and completion criteria.
